import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { CastMember } from '@/types/database';

// Fetch all cast members (for autocomplete in admin)
export function useCastMembers() {
  return useQuery({
    queryKey: ['cast-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cast_members')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as CastMember[];
    },
  });
}

// Fetch cast for a specific movie (with cast_member details)
export function useMovieCast(movieId: string) {
  return useQuery({
    queryKey: ['movie-cast', movieId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_cast')
        .select('*, cast_members(*)')
        .eq('movie_id', movieId)
        .order('display_order');
      if (error) throw error;
      return (data || []).map((item: any) => ({
        id: item.id,
        movie_id: item.movie_id,
        cast_member_id: item.cast_member_id,
        character_name: item.character_name,
        display_order: item.display_order,
        created_at: item.created_at,
        cast_member: item.cast_members as CastMember,
      }));
    },
    enabled: !!movieId,
  });
}

// Fetch actor details by ID
export function useCastMember(castMemberId: string) {
  return useQuery({
    queryKey: ['cast-member', castMemberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cast_members')
        .select('*')
        .eq('id', castMemberId)
        .single();
      if (error) throw error;
      return data as CastMember;
    },
    enabled: !!castMemberId,
  });
}

// Fetch filmography for a specific actor
export function useActorFilmography(castMemberId: string) {
  return useQuery({
    queryKey: ['actor-filmography', castMemberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('movie_cast')
        .select('*, movies(*)')
        .eq('cast_member_id', castMemberId)
        .order('display_order');
      if (error) throw error;
      return (data || []).map((item: any) => ({
        ...item,
        movie: item.movies,
      }));
    },
    enabled: !!castMemberId,
  });
}

// Save cast for a movie (upsert cast_members + movie_cast)
export function useSaveMovieCast() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      movieId,
      castEntries,
    }: {
      movieId: string;
      castEntries: {
        name: string;
        character_name: string;
        photo_url: string | null;
        existing_cast_member_id?: string;
      }[];
    }) => {
      // First, delete existing movie_cast entries for this movie
      const { error: deleteError } = await supabase
        .from('movie_cast')
        .delete()
        .eq('movie_id', movieId);
      if (deleteError) throw deleteError;

      // Process each cast entry
      for (let i = 0; i < castEntries.length; i++) {
        const entry = castEntries[i];
        let castMemberId = entry.existing_cast_member_id;

        if (castMemberId) {
          // Update existing cast member photo if changed
          const { error: updateError } = await supabase
            .from('cast_members')
            .update({ photo_url: entry.photo_url, name: entry.name })
            .eq('id', castMemberId);
          if (updateError) throw updateError;
        } else {
          // Check if cast member with this name already exists
          const { data: existing } = await supabase
            .from('cast_members')
            .select('id')
            .eq('name', entry.name)
            .maybeSingle();

          if (existing) {
            castMemberId = existing.id;
            // Update photo if provided
            if (entry.photo_url) {
              await supabase
                .from('cast_members')
                .update({ photo_url: entry.photo_url })
                .eq('id', castMemberId);
            }
          } else {
            // Create new cast member
            const { data: newMember, error: insertError } = await supabase
              .from('cast_members')
              .insert({ name: entry.name, photo_url: entry.photo_url })
              .select('id')
              .single();
            if (insertError) throw insertError;
            castMemberId = newMember.id;
          }
        }

        // Create movie_cast entry
        const { error: linkError } = await supabase
          .from('movie_cast')
          .insert({
            movie_id: movieId,
            cast_member_id: castMemberId,
            character_name: entry.character_name || null,
            display_order: i,
          });
        if (linkError) throw linkError;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movie-cast', variables.movieId] });
      queryClient.invalidateQueries({ queryKey: ['cast-members'] });
    },
  });
}

// Upload cast photo to storage
export async function uploadCastPhoto(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `cast-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `cast/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('movie-posters')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('movie-posters')
    .getPublicUrl(filePath);

  return publicUrl;
}
