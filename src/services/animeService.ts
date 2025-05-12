// src/services/animeService.ts
'use server';

import { db } from '@/lib/firebase';
import type { Anime, Episode, Character as AppCharacter, VoiceActor as AppVoiceActor } from '@/types/anime';
import { convertAnimeTimestampsForClient, mapAniListStatusToAppStatus, mapAniListFormatToAppType } from '@/lib/animeUtils';
import { slugify } from '@/lib/stringUtils';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  FirestoreError,
  documentId,
  QueryConstraint,
  startAt,
  endAt,
  getCountFromServer,
  serverTimestamp
} from 'firebase/firestore';
import { fetchAniListMediaDetails } from './aniListService'; // Import AniList service
import type { AniListCharacterEdge, AniListMedia } from '@/types/anilist';


const animesCollection = collection(db, 'animes');

const MAX_IDS_PER_QUERY = 30; // Firestore 'in' query limit for web

// Centralized error handler
const handleFirestoreError = (error: unknown, context: string): FirestoreError => {
  console.error(`Firestore Error in ${context}:`, error);
  if (error instanceof FirestoreError) {
    return error;
  }
  const genericError = new FirestoreError('unknown', `An unknown error occurred in ${context}.`);
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    (genericError as any).message = error.message;
  }
  return genericError;
};

export async function getAllAnimes(
  options: {
    count?: number;
    filters?: {
      genre?: string;
      type?: Anime['type'];
      status?: Anime['status'];
      year?: number;
      featured?: boolean;
      sortBy?: 'title' | 'year' | 'averageRating' | 'updatedAt' | 'createdAt' | 'popularity';
      sortOrder?: 'asc' | 'desc';
      searchQuery?: string;
    };
  } = {}
): Promise<Anime[]> {
  const { count = 20, filters = {} } = options;
  const queryConstraints: QueryConstraint[] = [];

  let effectiveSortBy = filters.sortBy;
  let effectiveSortOrder = filters.sortOrder || (filters.sortBy === 'title' ? 'asc' : 'desc');
  let hasSpecificDefaultSortApplied = false; 

  if (filters.searchQuery && filters.searchQuery.trim() !== '') {
    const searchTerm = filters.searchQuery.trim();
    queryConstraints.push(orderBy('title'));
    queryConstraints.push(startAt(searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase()));
    queryConstraints.push(endAt(searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase() + '\uf8ff'));
    effectiveSortBy = undefined; 
  } else {
    if (filters.genre) {
      queryConstraints.push(where('genre', 'array-contains', filters.genre));
      if (!effectiveSortBy) { 
        effectiveSortBy = 'popularity'; 
        effectiveSortOrder = 'desc';
        hasSpecificDefaultSortApplied = true;
      }
    }
    if (filters.type) {
      queryConstraints.push(where('type', '==', filters.type));
       if (!effectiveSortBy) { 
        effectiveSortBy = 'popularity';
        effectiveSortOrder = 'desc';
        hasSpecificDefaultSortApplied = true;
      }
    }
    if (filters.status) {
      queryConstraints.push(where('status', '==', filters.status));
       if (!effectiveSortBy) { 
        effectiveSortBy = 'updatedAt';
        effectiveSortOrder = 'desc';
        hasSpecificDefaultSortApplied = true;
      }
    }
    if (filters.year) {
      queryConstraints.push(where('year', '==', filters.year));
        if (!effectiveSortBy) { 
        effectiveSortBy = 'popularity';
        effectiveSortOrder = 'desc';
        hasSpecificDefaultSortApplied = true;
      }
    }
    if (filters.featured !== undefined) {
      queryConstraints.push(where('isFeatured', '==', filters.featured));
       if (!effectiveSortBy) { 
        effectiveSortBy = 'popularity'; 
        effectiveSortOrder = 'desc';
        hasSpecificDefaultSortApplied = true;
      }
    }

    if (effectiveSortBy) {
      queryConstraints.push(orderBy(effectiveSortBy, effectiveSortOrder));
      if (effectiveSortBy !== 'title' && !hasSpecificDefaultSortApplied) {
         // queryConstraints.push(orderBy('title', 'asc')); // Removed to simplify indexing
      }
    } else if (!hasSpecificDefaultSortApplied) {
      queryConstraints.push(orderBy('updatedAt', 'desc'));
      // queryConstraints.push(orderBy('title', 'asc')); // Removed to simplify indexing
    }
  }
  
  const effectiveCount = count === -1 ? 1000 : (count > 0 ? count : 20);
  if (effectiveCount > 0) { 
    queryConstraints.push(limit(effectiveCount));
  } else if (count === 0) {
     console.warn("getAllAnimes called with count: 0. Returning empty array.");
     return [];
  }

  const q = query(animesCollection, ...queryConstraints);

  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => convertAnimeTimestampsForClient(docSnap.data() as Anime));
  } catch (error) {
     if (error instanceof FirestoreError && error.code === 'failed-precondition' && error.message.includes("index")) {
      const specificIndexMessage = `Firestore query in getAllAnimes requires an index. Details: ${error.message}. Query based on Filters: ${JSON.stringify(filters)}, SortBy: ${effectiveSortBy || 'default (updatedAt)'}, SortOrder: ${effectiveSortOrder}. You can create this index in the Firebase console.`;
      console.warn(specificIndexMessage);
      throw handleFirestoreError(error, `getAllAnimes (Index Required) - Filters: ${JSON.stringify(filters)}, SortBy: ${effectiveSortBy || 'default (updatedAt)'}, SortOrder: ${effectiveSortOrder}. Message: ${specificIndexMessage}`);
    }
    throw handleFirestoreError(error, `getAllAnimes - Filters: ${JSON.stringify(filters)}, SortBy: ${effectiveSortBy || 'default (updatedAt)'}, SortOrder: ${effectiveSortOrder}`);
  }
}


export async function getFeaturedAnimes(
  options: {
    count?: number;
    sortBy?: 'popularity' | 'updatedAt' | 'title'; 
    sortOrder?: 'asc' | 'desc';
  } = {}
): Promise<Anime[]> {
  const { count = 5, sortBy = 'popularity', sortOrder = 'desc' } = options;

  const queryConstraints: QueryConstraint[] = [
    where('isFeatured', '==', true),
  ];

  if (sortBy === 'popularity') {
    queryConstraints.push(orderBy('popularity', sortOrder));
    // queryConstraints.push(orderBy('updatedAt', 'desc')); 
  } else if (sortBy === 'updatedAt') {
    queryConstraints.push(orderBy('updatedAt', sortOrder));
    // queryConstraints.push(orderBy('title', 'asc')); 
  } else if (sortBy === 'title') {
    queryConstraints.push(orderBy('title', sortOrder));
    // queryConstraints.push(orderBy('popularity', 'desc'));
  } else {
    queryConstraints.push(orderBy('popularity', 'desc'));
    // queryConstraints.push(orderBy('updatedAt', 'desc'));
  }
   
  const effectiveCount = count === -1 ? 25 : (count > 0 ? count : 5);
   if (effectiveCount > 0) {
     queryConstraints.push(limit(effectiveCount));
   } else if (count === 0) {
     console.warn("getFeaturedAnimes called with count: 0. Returning empty array.");
     return [];
   }
  
  const q = query(animesCollection, ...queryConstraints);

  try {
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => convertAnimeTimestampsForClient(docSnap.data() as Anime));
  } catch (error) {
     if (error instanceof FirestoreError && error.code === 'failed-precondition' && error.message.includes("index")) {
      const specificIndexMessage = `Firestore query for getFeaturedAnimes requires an index. Details: ${error.message}. Query: isFeatured == true, orderBy ${sortBy} ${sortOrder}. You can create this index in the Firebase console.`;
      console.warn(specificIndexMessage);
      
      console.warn(`getFeaturedAnimes: Falling back to sort by updatedAt due to missing index for '${sortBy}' on featured items.`);
      try {
        const fallbackQueryConstraints: QueryConstraint[] = [
          where('isFeatured', '==', true),
          orderBy('updatedAt', 'desc'), 
          // orderBy('title', 'asc') 
        ];
        if (effectiveCount > 0) {
          fallbackQueryConstraints.push(limit(effectiveCount));
        }
        const fallbackQuery = query(animesCollection, ...fallbackQueryConstraints);
        const fallbackSnapshot = await getDocs(fallbackQuery);
        return fallbackSnapshot.docs.map(docSnap => convertAnimeTimestampsForClient(docSnap.data() as Anime));
      } catch (fallbackError) {
        console.error("Fallback query for getFeaturedAnimes (sorted by updatedAt) also failed:", fallbackError);
        throw handleFirestoreError(fallbackError, `getFeaturedAnimes (fallback after index error) - Original Error: ${specificIndexMessage}`);
      }
    }
    throw handleFirestoreError(error, `getFeaturedAnimes (sortBy: ${sortBy})`);
  }
}


export async function getAnimeById(id: string): Promise<Anime | undefined> {
  if (!id) {
    console.warn("getAnimeById called with no ID");
    return undefined;
  }
  const docRef = doc(animesCollection, id);
  try {
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      console.warn(`Anime with ID ${id} not found in Firestore.`);
      return undefined;
    }

    let animeData = docSnap.data() as Anime;

    if (animeData.aniListId) {
      const aniListData = await fetchAniListMediaDetails({ id: animeData.aniListId });
      if (aniListData) {
        animeData = {
          ...animeData, 
          title: aniListData.title?.english || aniListData.title?.userPreferred || aniListData.title?.romaji || animeData.title,
          bannerImage: aniListData.bannerImage || animeData.bannerImage,
          coverImage: aniListData.coverImage?.extraLarge || aniListData.coverImage?.large || animeData.coverImage,
          synopsis: aniListData.description || animeData.synopsis,
          genre: aniListData.genres || animeData.genre,
          status: mapAniListStatusToAppStatus(aniListData.status) || animeData.status,
          averageRating: aniListData.averageScore ? parseFloat((aniListData.averageScore / 10).toFixed(1)) : animeData.averageRating,
          popularity: aniListData.popularity || animeData.popularity,
          season: aniListData.season || animeData.season,
          seasonYear: aniListData.seasonYear || animeData.seasonYear,
          format: mapAniListFormatToAppType(aniListData.format) || animeData.format,
          duration: aniListData.duration || animeData.duration,
          countryOfOrigin: aniListData.countryOfOrigin || animeData.countryOfOrigin,
          source: aniListData.source || animeData.source,
          studios: aniListData.studios?.edges?.map(edge => edge.node).filter(studio => studio.isAnimationStudio) || animeData.studios,
          episodesCount: aniListData.episodes || animeData.episodesCount,
          trailerUrl: (aniListData.trailer?.site === 'youtube' && aniListData.trailer?.id) ? `https://www.youtube.com/watch?v=${aniListData.trailer.id}` : animeData.trailerUrl,
          airedFrom: aniListData.startDate ? `${aniListData.startDate.year}-${String(aniListData.startDate.month).padStart(2,'0')}-${String(aniListData.startDate.day).padStart(2,'0')}` : animeData.airedFrom,
          airedTo: aniListData.endDate ? `${aniListData.endDate.year}-${String(aniListData.endDate.month).padStart(2,'0')}-${String(aniListData.endDate.day).padStart(2,'0')}` : animeData.airedTo,
          characters: aniListData.characters?.edges?.map((edge: AniListCharacterEdge): AppCharacter => ({
            id: edge.node.id,
            name: edge.node.name?.userPreferred || edge.node.name?.full || 'Unknown Character',
            role: edge.role || 'Unknown',
            image: edge.node.image?.large || null,
            voiceActors: edge.voiceActors?.map((va): AppVoiceActor => ({
              id: va.id,
              name: va.name?.userPreferred || va.name?.full || 'Unknown VA',
              image: va.image?.large || null,
              language: va.languageV2 || 'Unknown',
            })) || [],
          })) || animeData.characters,
        };
      }
    }
    return convertAnimeTimestampsForClient(animeData);
  } catch (error) {
    throw handleFirestoreError(error, `getAnimeById (id: ${id})`);
  }
}


export async function getAnimesByIds(ids: string[]): Promise<Anime[]> {
  if (!ids || ids.length === 0) {
    return [];
  }
  const results: Anime[] = [];
  const fetchedAnimesMap = new Map<string, Anime>();

  for (let i = 0; i < ids.length; i += MAX_IDS_PER_QUERY) {
    const batchIds = ids.slice(i, i + MAX_IDS_PER_QUERY).filter(id => id); 
    if (batchIds.length === 0) continue;

    const q = query(animesCollection, where(documentId(), 'in', batchIds));
    try {
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
         const anime = convertAnimeTimestampsForClient(docSnap.data() as Anime);
         fetchedAnimesMap.set(anime.id, anime);
      });
    } catch (error) {
      console.error(`Error fetching batch of animes by IDs (batch starting with ${batchIds[0]}):`, error);
    }
  }
  ids.forEach(id => {
    if(fetchedAnimesMap.has(id)){
      results.push(fetchedAnimesMap.get(id)!);
    }
  });
  return results;
}


export async function addAnimeToFirestore(animeData: Omit<Anime, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const slug = slugify(animeData.title);
  if (!slug) {
    throw new Error("Failed to generate a valid slug from the title. Title might be empty or contain only special characters.");
  }
  const docRef = doc(animesCollection, slug);

  const dataToSave: any = { 
    ...animeData,
    id: slug, 
    updatedAt: serverTimestamp(),
  };

  dataToSave.trailerUrl = animeData.trailerUrl || null;
  dataToSave.bannerImage = animeData.bannerImage || null;
  dataToSave.averageRating = animeData.averageRating === undefined ? null : animeData.averageRating;
  dataToSave.popularity = animeData.popularity === undefined ? 0 : animeData.popularity; 
  dataToSave.isFeatured = animeData.isFeatured === undefined ? false : animeData.isFeatured; 
  dataToSave.aniListId = animeData.aniListId || null;
  dataToSave.downloadPageUrl = animeData.downloadPageUrl || null;
  
  dataToSave.episodes = (animeData.episodes || []).map(ep => ({
    ...ep,
    url: ep.url || null, 
    thumbnail: ep.thumbnail || null, 
  }));

  dataToSave.season = animeData.season || null;
  dataToSave.seasonYear = animeData.seasonYear || (animeData.year || null); 
  dataToSave.countryOfOrigin = animeData.countryOfOrigin || null;
  dataToSave.studios = animeData.studios || [];
  dataToSave.source = animeData.source || null;
  dataToSave.format = animeData.format || animeData.type || null; 
  dataToSave.duration = animeData.duration || null;
  dataToSave.airedFrom = animeData.airedFrom || null;
  dataToSave.airedTo = animeData.airedTo || null;
  dataToSave.episodesCount = animeData.episodesCount || dataToSave.episodes?.length || 0;
  dataToSave.characters = animeData.characters || [];


  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.warn(`Anime with slug "${slug}" already exists. Updating existing document.`);
      const existingData = docSnap.data();
      const updatePayload = { ...existingData, ...dataToSave };
      await updateDoc(docRef, updatePayload);
    } else {
      dataToSave.createdAt = serverTimestamp();
      await setDoc(docRef, dataToSave);
    }
    return slug;
  } catch (error) {
    throw handleFirestoreError(error, `addAnimeToFirestore (title: ${animeData.title})`);
  }
}

export async function updateAnimeInFirestore(id: string, animeData: Partial<Omit<Anime, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  if (!id) {
    throw new Error("Anime ID is required for update.");
  }
  const docRef = doc(animesCollection, id);
  try {
    const updatePayload: { [key: string]: any } = { ...animeData, updatedAt: serverTimestamp() };

    if (animeData.hasOwnProperty('trailerUrl')) {
      updatePayload.trailerUrl = animeData.trailerUrl || null;
    }
    if (animeData.hasOwnProperty('bannerImage')) {
      updatePayload.bannerImage = animeData.bannerImage || null;
    }
    if (animeData.hasOwnProperty('aniListId')) {
      updatePayload.aniListId = animeData.aniListId || null;
    }
    if (animeData.hasOwnProperty('downloadPageUrl')) {
      updatePayload.downloadPageUrl = animeData.downloadPageUrl || null;
    }
    if (animeData.hasOwnProperty('averageRating') && animeData.averageRating === undefined) {
      updatePayload.averageRating = null;
    }
     if (animeData.hasOwnProperty('popularity') && animeData.popularity === undefined) {
       updatePayload.popularity = 0;
    }
     if (animeData.hasOwnProperty('isFeatured') && animeData.isFeatured === undefined) {
       updatePayload.isFeatured = false;
    }
    
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key] === undefined && 
          !['trailerUrl', 'bannerImage', 'aniListId', 'averageRating', 'popularity', 'isFeatured', 'downloadPageUrl'].includes(key)) { 
        delete updatePayload[key]; 
      }
    });

    await updateDoc(docRef, updatePayload);
  } catch (error) {
    throw handleFirestoreError(error, `updateAnimeInFirestore (id: ${id})`);
  }
}


export async function deleteAnimeFromFirestore(id: string): Promise<void> {
  const docRef = doc(animesCollection, id);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    throw handleFirestoreError(error, `deleteAnimeFromFirestore (id: ${id})`);
  }
}

export async function updateAnimeEpisode(animeId: string, episodeId: string, episodeData: Partial<Episode>): Promise<void> {
  const animeRef = doc(animesCollection, animeId);
  try {
    const animeSnap = await getDoc(animeRef);
    if (!animeSnap.exists()) {
      throw new Error(`Anime with ID ${animeId} not found.`);
    }
    const anime = animeSnap.data() as Anime;
    const episodes = anime.episodes ? [...anime.episodes] : [];
    const episodeIndex = episodes.findIndex(ep => ep.id === episodeId);

    if (episodeIndex === -1) {
      throw new Error(`Episode with ID ${episodeId} not found in anime ${animeId}.`);
    }

    episodes[episodeIndex] = {
      ...episodes[episodeIndex],
      ...episodeData,
      url: episodeData.url === '' ? null : (episodeData.url !== undefined ? episodeData.url : episodes[episodeIndex].url),
      thumbnail: episodeData.thumbnail === '' ? null : (episodeData.thumbnail !== undefined ? episodeData.thumbnail : episodes[episodeIndex].thumbnail),
    };

    await updateDoc(animeRef, { episodes: episodes, updatedAt: serverTimestamp() });
  } catch (error) {
    throw handleFirestoreError(error, `updateAnimeEpisode (animeId: ${animeId}, episodeId: ${episodeId})`);
  }
}

export async function updateAnimeIsFeatured(animeId: string, isFeatured: boolean): Promise<void> {
  const animeRef = doc(animesCollection, animeId);
  try {
    await updateDoc(animeRef, { isFeatured: isFeatured, updatedAt: serverTimestamp() });
  } catch (error) {
    throw handleFirestoreError(error, `updateAnimeIsFeatured (animeId: ${animeId})`);
  }
}

export async function getUniqueGenres(): Promise<string[]> {
  const comprehensiveFallbackGenres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Demons', 'Drama', 'Ecchi', 
    'Family', 'Fantasy', 'Game', 'Harem', 'Historical', 'Horror', 'Isekai', 'Josei', 
    'Kids', 'Magic', 'Martial Arts', 'Mecha', 'Military', 'Music', 'Mystery', 'Parody', 
    'Police', 'Psychological', 'Reality', 'Romance', 'Samurai', 'School', 'Sci-Fi', 
    'Seinen', 'Shoujo', 'Shounen', 'Slice of Life', 'Soap', 'Space', 'Sports', 
    'Super Power', 'Supernatural', 'Talk', 'Thriller', 'Vampire', 'War & Politics', 'Western'
  ].sort();

  try {
    const q = query(animesCollection, orderBy('title'), limit(1000)); 
    const querySnapshot = await getDocs(q);
    const genresSet = new Set<string>();
    querySnapshot.forEach(docSnap => {
      const anime = docSnap.data() as Anime;
      if (anime.genre && Array.isArray(anime.genre)) {
        anime.genre.forEach(g => {
          if (typeof g === 'string' && g.trim() !== '') {
            genresSet.add(g.trim());
          }
        });
      }
    });
    
    const fetchedGenres = Array.from(genresSet);
    const finalGenres = Array.from(new Set([...fetchedGenres, ...comprehensiveFallbackGenres])).sort();
    
    if (finalGenres.length === 0) {
      console.warn("getUniqueGenres: No genres found and fallback list somehow empty. This is unexpected.");
      return [];
    }
    return finalGenres;
  } catch (error) {
    console.error("Error in getUniqueGenres, returning comprehensive fallback list:", error);
    return comprehensiveFallbackGenres;
  }
}


export async function searchAnimes(searchTerm: string, count: number = 20): Promise<Anime[]> {
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }
  const lowerSearchTerm = searchTerm.toLowerCase();
  const effectiveCount = count > 0 ? count : 20;

  try {
    const searchTermCapitalized = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();
    
    const titleQueryConstraints: QueryConstraint[] = [
        orderBy('title'), 
        startAt(searchTermCapitalized),
        endAt(searchTermCapitalized + '\uf8ff'), 
        limit(effectiveCount * 2) 
    ];
    const titleQuery = query(animesCollection, ...titleQueryConstraints);
    const titleSnapshot = await getDocs(titleQuery);
    let results = titleSnapshot.docs.map(docSnap => convertAnimeTimestampsForClient(docSnap.data() as Anime));

    results = results.filter(anime =>
      anime.title.toLowerCase().includes(lowerSearchTerm) ||
      (anime.genre && anime.genre.some(g => g.toLowerCase().includes(lowerSearchTerm)))
    );

    results.sort((a, b) => {
        const aTitleLower = a.title.toLowerCase();
        const bTitleLower = b.title.toLowerCase();

        const aIsDirectMatch = aTitleLower === lowerSearchTerm;
        const bIsDirectMatch = bTitleLower === lowerSearchTerm;
        if (aIsDirectMatch && !bIsDirectMatch) return -1;
        if (!aIsDirectMatch && bIsDirectMatch) return 1;

        const aStartsWith = aTitleLower.startsWith(lowerSearchTerm);
        const bStartsWith = bTitleLower.startsWith(lowerSearchTerm);
        if (aStartsWith && !bStartsWith) return -1;
        if (!aStartsWith && bStartsWith) return 1;
        
        if ((b.popularity || 0) !== (a.popularity || 0)) {
            return (b.popularity || 0) - (a.popularity || 0);
        }
        return aTitleLower.localeCompare(bTitleLower);
    });

    return results.slice(0, effectiveCount);

  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'failed-precondition') {
        console.warn("Search by title prefix failed due to missing index. Attempting broader client-side search for:", searchTerm, error.message);
        try {
            const allAnimesForSearch = await getAllAnimes({ count: 200, filters: { sortBy: 'popularity', sortOrder: 'desc'} }); 
            let filtered = allAnimesForSearch.filter(anime =>
                anime.title.toLowerCase().includes(lowerSearchTerm) ||
                (anime.genre && anime.genre.some(g => g.toLowerCase().includes(lowerSearchTerm)))
            );
            filtered.sort((a, b) => { 
                const aTitleLower = a.title.toLowerCase();
                const bTitleLower = b.title.toLowerCase();
                if (aTitleLower.startsWith(lowerSearchTerm) && !bTitleLower.startsWith(lowerSearchTerm)) return -1;
                if (!aTitleLower.startsWith(lowerSearchTerm) && bTitleLower.startsWith(lowerSearchTerm)) return 1;
                 if ((b.popularity || 0) !== (a.popularity || 0)) {
                    return (b.popularity || 0) - (a.popularity || 0);
                }
                return aTitleLower.localeCompare(bTitleLower);
            });
            return filtered.slice(0, effectiveCount);
        } catch (broadSearchError) {
             throw handleFirestoreError(broadSearchError, `searchAnimes (broad fallback for term: ${searchTerm})`);
        }
    }
    throw handleFirestoreError(error, `searchAnimes (term: ${searchTerm})`);
  }
}


export async function getTotalAnimeCount(): Promise<number> {
  try {
    const snapshot = await getCountFromServer(animesCollection);
    return snapshot.data().count;
  } catch (error) {
    throw handleFirestoreError(error, 'getTotalAnimeCount');
  }
}