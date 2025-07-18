
// src/services/animeService.ts
'use server';

import { db } from '@/lib/firebase';
import type { Anime, Episode, VideoSource, Character as AppCharacter, VoiceActor as AppVoiceActor } from '@/types/anime';
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
  serverTimestamp,
  or
} from 'firebase/firestore';
import { fetchAniListMediaDetails } from './aniListService';
import type { AniListCharacterEdge, AniListMedia } from '@/types/anilist';
import { revalidatePath } from 'next/cache';

const animesCollection = collection(db, 'animes');

const MAX_IDS_PER_QUERY = 30;

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
    } else if (!hasSpecificDefaultSortApplied && !filters.searchQuery) {
      queryConstraints.push(orderBy('updatedAt', 'desc'));
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
  } else if (sortBy === 'updatedAt') {
    queryConstraints.push(orderBy('updatedAt', sortOrder));
  } else if (sortBy === 'title') {
    queryConstraints.push(orderBy('title', sortOrder));
  } else {
    queryConstraints.push(orderBy('popularity', 'desc'));
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
          genre: aniListData.genres || animeData.genre || [],
          status: mapAniListStatusToAppStatus(aniListData.status) || animeData.status,
          averageRating: aniListData.averageScore ? parseFloat((aniListData.averageScore / 10).toFixed(1)) : animeData.averageRating,
          popularity: aniListData.popularity || animeData.popularity,
          season: aniListData.season || animeData.season,
          seasonYear: aniListData.seasonYear || animeData.seasonYear,
          format: mapAniListFormatToAppType(aniListData.format) || animeData.format,
          duration: aniListData.duration || animeData.duration,
          countryOfOrigin: aniListData.countryOfOrigin || animeData.countryOfOrigin,
          source: aniListData.source || animeData.source,
          studios: (aniListData.studios?.edges?.map(edge => edge.node).filter(studio => studio.isAnimationStudio) || animeData.studios) || [],
          episodesCount: aniListData.episodes || animeData.episodesCount,
          trailerUrl: (aniListData.trailer?.site === 'youtube' && aniListData.trailer?.id) ? `https://www.youtube.com/watch?v=${aniListData.trailer.id}` : animeData.trailerUrl,
          airedFrom: aniListData.startDate ? `${aniListData.startDate.year}-${String(aniListData.startDate.month).padStart(2,'0')}-${String(aniListData.startDate.day).padStart(2,'0')}` : animeData.airedFrom,
          airedTo: aniListData.endDate ? `${aniListData.endDate.year}-${String(aniListData.endDate.month).padStart(2,'0')}-${String(aniListData.endDate.day).padStart(2,'0')}` : animeData.airedTo,
          characters: (aniListData.characters?.edges?.map((edge: AniListCharacterEdge): AppCharacter => ({
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
          })) || animeData.characters) || [],
        };
      }
    }

    animeData.episodes = (animeData.episodes || []).map((ep, index) => ({
      ...ep,
      id: ep.id || `${animeData.id}-s${ep.seasonNumber || 0}-e${ep.episodeNumber || index}-${Date.now()}`,
      title: ep.title || null,
      episodeNumber: typeof ep.episodeNumber === 'number' ? ep.episodeNumber : null,
      seasonNumber: typeof ep.seasonNumber === 'number' ? ep.seasonNumber : null,
      thumbnail: ep.thumbnail || null,
      duration: ep.duration || null,
      overview: ep.overview || null,
      airDate: ep.airDate || null,
      sources: (ep.sources || []).map((source, sourceIdx) => ({
        id: source.id || `source-${animeData.id}-ep${ep.id}-${Date.now()}-${sourceIdx}`,
        url: source.url || null,
        label: source.label || null,
        type: source.type || 'mp4',
        category: source.category || 'SUB',
        quality: source.quality || null,
      }))
    }));

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
    id: slug,
    updatedAt: serverTimestamp(),

    title: animeData.title || null, 
    coverImage: animeData.coverImage || null, 
    synopsis: animeData.synopsis || null,
    type: animeData.type || 'Unknown',
    status: animeData.status || 'Unknown',
    sourceAdmin: animeData.sourceAdmin || 'manual',
    year: (typeof animeData.year === 'number' && !isNaN(animeData.year)) ? animeData.year : null,
    bannerImage: animeData.bannerImage || null,
    averageRating: (typeof animeData.averageRating === 'number' && !isNaN(animeData.averageRating)) ? animeData.averageRating : null,
    popularity: (typeof animeData.popularity === 'number' && !isNaN(animeData.popularity)) ? animeData.popularity : 0, 
    isFeatured: animeData.isFeatured === undefined ? false : animeData.isFeatured, 
    aniListId: (typeof animeData.aniListId === 'number' && !isNaN(animeData.aniListId)) ? animeData.aniListId : null,
    trailerUrl: animeData.trailerUrl || null,
    downloadPageUrl: animeData.downloadPageUrl || null,
    season: animeData.season || null,
    seasonYear: (typeof animeData.seasonYear === 'number' && !isNaN(animeData.seasonYear)) ? animeData.seasonYear : ((typeof animeData.year === 'number' && !isNaN(animeData.year)) ? animeData.year : null),
    countryOfOrigin: animeData.countryOfOrigin || null,
    source: animeData.source || null,
    format: animeData.format || (animeData.type || 'Unknown'), 
    duration: (typeof animeData.duration === 'number' && !isNaN(animeData.duration)) ? animeData.duration : null, 
    airedFrom: animeData.airedFrom || null,
    airedTo: animeData.airedTo || null,
    genre: Array.isArray(animeData.genre) ? animeData.genre : [],
    studios: Array.isArray(animeData.studios) ? animeData.studios : [],
    characters: Array.isArray(animeData.characters) ? animeData.characters : [],
    tmdbId: animeData.tmdbId || null,
  };

  dataToSave.episodes = (animeData.episodes || []).map((ep, index) => {
    const episodeId = ep.id || `${slug}-s${(typeof ep.seasonNumber === 'number' && !isNaN(ep.seasonNumber) ? ep.seasonNumber : 0)}-e${(typeof ep.episodeNumber === 'number' && !isNaN(ep.episodeNumber) ? ep.episodeNumber : index)}-${Date.now()}`;
    
    const sources = (ep.sources || []).map((source, sourceIdx) => ({
      id: source.id || `source-${episodeId}-${Date.now()}-${sourceIdx}`,
      url: source.url || null, 
      label: source.label || null, 
      type: source.type || 'mp4', 
      category: source.category || 'SUB', 
      quality: (source.quality === '' || source.quality === undefined) ? null : source.quality,
    }));

    return {
      id: episodeId,
      title: ep.title || null,
      episodeNumber: (typeof ep.episodeNumber === 'number' && !isNaN(ep.episodeNumber)) ? ep.episodeNumber : null,
      seasonNumber: (typeof ep.seasonNumber === 'number' && !isNaN(ep.seasonNumber)) ? ep.seasonNumber : null,
      thumbnail: (ep.thumbnail === '' || ep.thumbnail === undefined) ? null : ep.thumbnail,
      duration: ep.duration || null,
      overview: ep.overview || null,
      airDate: ep.airDate || null,
      sources: sources.length > 0 ? sources : null, 
    };
  });
  dataToSave.episodesCount = dataToSave.episodes?.length || 0;
  
  if (dataToSave.episodes) {
    dataToSave.episodes.forEach((ep: any) => delete ep.url);
  }

  try {
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      console.warn(`Anime with slug "${slug}" already exists. Updating existing document.`);
      const existingData = docSnap.data();
      const updatePayload = { 
        ...existingData, 
        ...dataToSave, 
        updatedAt: serverTimestamp(), 
        createdAt: existingData.createdAt || serverTimestamp() 
      };
      await updateDoc(docRef, updatePayload);
    } else {
      dataToSave.createdAt = serverTimestamp();
      await setDoc(docRef, dataToSave);
    }
    revalidatePath('/');
    revalidatePath('/browse');
    revalidatePath('/genres');
    revalidatePath(`/anime/${slug}`);
    revalidatePath('/admin/content-management');
    revalidatePath('/admin/episode-editor');
    revalidatePath('/admin/manual-add');
    return slug;
  } catch (error) {
    console.error("Error in addAnimeToFirestore for title:", animeData.title, "Payload being sent:", JSON.stringify(dataToSave, null, 2));
    throw handleFirestoreError(error, `addAnimeToFirestore (title: ${animeData.title})`);
  }
}

export async function updateAnimeInFirestore(id: string, animeData: Partial<Omit<Anime, 'id' | 'createdAt' | 'updatedAt'>>): Promise<void> {
  if (!id) {
    throw new Error("Anime ID is required for update.");
  }
  const docRef = doc(animesCollection, id);
  const updatePayload: { [key: string]: any } = { updatedAt: serverTimestamp() };

  const sanitizeForFirestore = (value: any, isNumericField: boolean = false, isBooleanField: boolean = false, isArrayField: boolean = false) => {
    if (value === undefined) {
      return null; 
    }
    if (isNumericField) {
      const num = Number(value); 
      return (typeof num === 'number' && !isNaN(num)) ? num : null;
    }
    if (isBooleanField) {
      return typeof value === 'boolean' ? value : false; 
    }
    if (isArrayField) {
      return Array.isArray(value) ? value : []; 
    }
    if (typeof value === 'string' && value === '') {
      const nullableStringFields = ['bannerImage', 'trailerUrl', 'downloadPageUrl', 'thumbnail', 'overview', 'airDate', 'duration', 'quality', 'season', 'countryOfOrigin', 'source', 'format'];
      const currentKey = Object.keys(animeData).find(k => animeData[k as keyof typeof animeData] === value); 
      if (currentKey && nullableStringFields.includes(currentKey)) {
        return null;
      }
    }
    return value;
  };
  
  (Object.keys(animeData) as Array<keyof typeof animeData>).forEach(key => {
    const value = animeData[key];
    if (key === 'episodes') {
      if (Array.isArray(value)) {
        updatePayload.episodes = value.map((ep: any, index: number) => {
          const episodeId = ep.id || `${id}-s${sanitizeForFirestore(ep.seasonNumber, true) || 0}-e${sanitizeForFirestore(ep.episodeNumber, true) || index}-${Date.now()}`;
          const sources = (ep.sources || []).map((source: any, sourceIdx: number) => ({
            id: source.id || `source-${episodeId}-${Date.now()}-${sourceIdx}`,
            url: sanitizeForFirestore(source.url),
            label: sanitizeForFirestore(source.label),
            type: source.type || 'mp4',
            category: source.category || 'SUB',
            quality: sanitizeForFirestore(source.quality),
          }));
          const cleanedEpisode = {
            id: episodeId,
            title: sanitizeForFirestore(ep.title),
            episodeNumber: sanitizeForFirestore(ep.episodeNumber, true),
            seasonNumber: sanitizeForFirestore(ep.seasonNumber, true),
            thumbnail: sanitizeForFirestore(ep.thumbnail),
            duration: sanitizeForFirestore(ep.duration),
            overview: sanitizeForFirestore(ep.overview),
            airDate: sanitizeForFirestore(ep.airDate),
            sources: sources.length > 0 ? sources : null,
          };
          return cleanedEpisode;
        });
        updatePayload.episodesCount = updatePayload.episodes?.length ?? 0;
      } else if (value === undefined || value === null) {
         updatePayload.episodes = null;
         updatePayload.episodesCount = 0;
      }
    } else {
        let isNumeric = ['year', 'averageRating', 'popularity', 'aniListId', 'duration', 'seasonYear'].includes(key);
        let isBoolean = ['isFeatured'].includes(key);
        let isArray = ['genre', 'studios', 'characters'].includes(key);
        const sanitized = sanitizeForFirestore(value, isNumeric, isBoolean, isArray);
        
        if (animeData.hasOwnProperty(key) || (isBoolean && value === undefined)) {
             updatePayload[key] = sanitized;
        }
    }
  });

  Object.keys(updatePayload).forEach(key => {
    if (updatePayload[key] === undefined) {
      console.warn(`updateAnimeInFirestore: field ${key} was undefined before updateDoc. Setting to null or default.`);
       if (key === 'isFeatured') updatePayload[key] = false;
       else if (key === 'popularity') updatePayload[key] = 0;
       else if (Array.isArray(updatePayload[key])) updatePayload[key] = [];
       else updatePayload[key] = null;
    }
  });

  try {
    await updateDoc(docRef, updatePayload);
    revalidatePath(`/anime/${id}`);
    revalidatePath('/');
    revalidatePath('/browse');
    revalidatePath('/admin/content-management');
    revalidatePath('/admin/episode-editor');
  } catch (error) {
    console.error("Error in updateAnimeInFirestore for ID:", id, "Payload:", JSON.stringify(updatePayload, null, 2));
    throw handleFirestoreError(error, `updateAnimeInFirestore (id: ${id})`);
  }
}


export async function deleteAnimeFromFirestore(id: string): Promise<void> {
  const docRef = doc(animesCollection, id);
  try {
    await deleteDoc(docRef);
    revalidatePath(`/anime/${id}`);
    revalidatePath('/');
    revalidatePath('/browse');
    revalidatePath('/genres');
    revalidatePath('/admin/content-management');
    revalidatePath('/admin/episode-editor');
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
    
    const currentEpisode = episodes[episodeIndex];
    const updatedEpisodeFields: Partial<Episode> = {};

    (Object.keys(episodeData) as Array<keyof Partial<Episode>>).forEach(key => {
        const value = episodeData[key];
        if (value === undefined) {
            if (['title', 'thumbnail', 'duration', 'overview', 'airDate', 'sources'].includes(key)) {
                 updatedEpisodeFields[key as keyof Episode] = null as any;
            }
        } else if (key === 'thumbnail' && value === '') {
            updatedEpisodeFields.thumbnail = null;
        } else if (key === 'sources') {
            updatedEpisodeFields.sources = (Array.isArray(value) ? value : []).map((source: any, idx: number) => ({
                id: source.id || `source-${animeId}-ep${episodeId}-${Date.now()}-${idx}`,
                url: source.url || null,
                label: source.label || null,
                type: source.type || 'mp4',
                category: source.category || 'SUB',
                quality: (source.quality === '' || source.quality === undefined) ? null : source.quality,
            }));
            if (updatedEpisodeFields.sources.length === 0) updatedEpisodeFields.sources = null;
        } else if (key === 'episodeNumber' || key === 'seasonNumber') {
            updatedEpisodeFields[key] = (typeof value === 'number' && !isNaN(value)) ? value : currentEpisode[key]; 
        }
         else {
            updatedEpisodeFields[key as keyof Episode] = value;
        }
    });
    
    episodes[episodeIndex] = {
      ...currentEpisode,
      ...updatedEpisodeFields,
    };
    if (episodes[episodeIndex].sources && episodes[episodeIndex].sources!.length > 0) {
        delete episodes[episodeIndex].url;
    }

    await updateDoc(animeRef, { episodes: episodes, updatedAt: serverTimestamp() });
    revalidatePath(`/anime/${animeId}`);
    revalidatePath(`/play/${animeId}`);
    revalidatePath('/admin/episode-editor');
  } catch (error) {
    console.error("Error in updateAnimeEpisode for animeId:", animeId, "episodeId:", episodeId, "Payload:", JSON.stringify(episodeData, null, 2));
    throw handleFirestoreError(error, `updateAnimeEpisode (animeId: ${animeId}, episodeId: ${episodeId})`);
  }
}

export async function updateAnimeIsFeatured(animeId: string, isFeatured: boolean): Promise<void> {
  const animeRef = doc(animesCollection, animeId);
  try {
    await updateDoc(animeRef, { 
      isFeatured: typeof isFeatured === 'boolean' ? isFeatured : false, 
      updatedAt: serverTimestamp() 
    });
    revalidatePath(`/anime/${animeId}`);
    revalidatePath('/');
    revalidatePath('/browse');
    revalidatePath('/admin/content-management');
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


export async function searchAnimes(searchTerm: string, count: number = 5): Promise<Anime[]> { 
  if (!searchTerm || searchTerm.trim() === '') {
    return [];
  }
  const lowerSearchTerm = searchTerm.toLowerCase();
  const effectiveCount = count > 0 ? count : 5;

  try {
    const searchTermCapitalized = searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1).toLowerCase();

    const titleQueryConstraints: QueryConstraint[] = [
        orderBy('title'),
        startAt(searchTermCapitalized),
        endAt(searchTermCapitalized + '\uf8ff'),
        limit(effectiveCount * 3) 
    ];
    const titleQuery = query(animesCollection, ...titleQueryConstraints);
    const titleSnapshot = await getDocs(titleQuery);
    let results = titleSnapshot.docs.map(docSnap => convertAnimeTimestampsForClient(docSnap.data() as Anime));

    results = results.filter(anime =>
      anime.title.toLowerCase().includes(lowerSearchTerm)
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

export async function getSimilarAnimes({
  currentAnimeId,
  currentAnimeGenres,
  count = 6,
}: {
  currentAnimeId: string;
  currentAnimeGenres: string[];
  count?: number;
}): Promise<Anime[]> {
  if (!currentAnimeGenres || currentAnimeGenres.length === 0) {
    // Fallback: get top popular anime excluding current one
    try {
      const popularAnimes = await getAllAnimes({ count: count + 1, filters: { sortBy: 'popularity', sortOrder: 'desc' } });
      return popularAnimes.filter(anime => anime.id !== currentAnimeId).slice(0, count);
    } catch (error) {
      console.error("Error fetching popular animes as fallback for similar animes:", error);
      return [];
    }
  }

  const queryConstraints: QueryConstraint[] = [
    where('genre', 'array-contains-any', currentAnimeGenres.slice(0, 10)), // Firestore limit for array-contains-any
    orderBy('popularity', 'desc'),
    limit(count + 10), // Fetch a bit more to filter out current anime and ensure enough results
  ];

  const q = query(animesCollection, ...queryConstraints);

  try {
    const querySnapshot = await getDocs(q);
    const similarAnimes = querySnapshot.docs
      .map(docSnap => convertAnimeTimestampsForClient(docSnap.data() as Anime))
      .filter(anime => anime.id !== currentAnimeId); // Exclude the current anime

    // If not enough results, we could try with fewer genre matches or just return what we have
    return similarAnimes.slice(0, count);
  } catch (error) {
    if (error instanceof FirestoreError && error.code === 'failed-precondition') {
      console.warn(`Firestore query for getSimilarAnimes (genres: ${currentAnimeGenres.join(', ')}) requires an index. Falling back to single genre search. Details: ${error.message}`);
      // Fallback to searching by the first genre if 'array-contains-any' index is missing
      try {
        const fallbackConstraints: QueryConstraint[] = [
          where('genre', 'array-contains', currentAnimeGenres[0]),
          orderBy('popularity', 'desc'),
          limit(count + 5),
        ];
        const fallbackQuery = query(animesCollection, ...fallbackConstraints);
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const fallbackAnimes = fallbackSnapshot.docs
          .map(docSnap => convertAnimeTimestampsForClient(docSnap.data() as Anime))
          .filter(anime => anime.id !== currentAnimeId);
        return fallbackAnimes.slice(0, count);
      } catch (fallbackError) {
        console.error("Fallback query for getSimilarAnimes also failed:", fallbackError);
        throw handleFirestoreError(fallbackError, `getSimilarAnimes (fallback - genres: ${currentAnimeGenres.join(', ')})`);
      }
    }
    throw handleFirestoreError(error, `getSimilarAnimes (genres: ${currentAnimeGenres.join(', ')})`);
  }
}


