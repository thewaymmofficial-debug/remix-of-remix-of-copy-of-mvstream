import { useState } from 'react';
import { Plus, Edit, Trash2, Crown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useMovies, useCreateMovie, useUpdateMovie, useDeleteMovie } from '@/hooks/useMovies';
import type { Movie, MovieInsert, MovieUpdate } from '@/types/database';
import { toast } from 'sonner';

const defaultMovie: MovieInsert = {
  title: '',
  description: '',
  director: '',
  actors: [],
  year: new Date().getFullYear(),
  category: 'Action',
  resolution: '1080p',
  file_size: '',
  poster_url: '',
  backdrop_url: '',
  stream_url: '',
  telegram_url: '',
  mega_url: '',
  is_premium: false,
  is_featured: false,
};

const categories = [
  'Action',
  'K-Drama',
  'Hollywood',
  'Thriller',
  'Comedy',
  'Romance',
  'Horror',
  'Sci-Fi',
  'Documentary',
  'Animation',
  'Drama',
  'Latest',
];

export default function MoviesAdmin() {
  const { data: movies, isLoading } = useMovies();
  const createMovie = useCreateMovie();
  const updateMovie = useUpdateMovie();
  const deleteMovie = useDeleteMovie();

  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState<Movie | null>(null);
  const [formData, setFormData] = useState<MovieInsert>(defaultMovie);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [movieToDelete, setMovieToDelete] = useState<Movie | null>(null);
  const [actorsInput, setActorsInput] = useState('');

  const filteredMovies = movies?.filter(
    (movie) =>
      movie.title.toLowerCase().includes(search.toLowerCase()) ||
      movie.category.toLowerCase().includes(search.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingMovie(null);
    setFormData(defaultMovie);
    setActorsInput('');
    setShowModal(true);
  };

  const openEditModal = (movie: Movie) => {
    setEditingMovie(movie);
    setFormData({
      title: movie.title,
      description: movie.description || '',
      director: movie.director || '',
      actors: movie.actors || [],
      year: movie.year || new Date().getFullYear(),
      category: movie.category,
      resolution: movie.resolution || '1080p',
      file_size: movie.file_size || '',
      poster_url: movie.poster_url || '',
      backdrop_url: movie.backdrop_url || '',
      stream_url: movie.stream_url || '',
      telegram_url: movie.telegram_url || '',
      mega_url: movie.mega_url || '',
      is_premium: movie.is_premium,
      is_featured: movie.is_featured,
    });
    setActorsInput(movie.actors?.join(', ') || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const movieData = {
      ...formData,
      actors: actorsInput.split(',').map((a) => a.trim()).filter(Boolean),
    };

    try {
      if (editingMovie) {
        await updateMovie.mutateAsync({ id: editingMovie.id, ...movieData });
        toast.success('Movie updated successfully');
      } else {
        await createMovie.mutateAsync(movieData);
        toast.success('Movie created successfully');
      }
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to save movie');
    }
  };

  const handleDelete = async () => {
    if (!movieToDelete) return;

    try {
      await deleteMovie.mutateAsync(movieToDelete.id);
      toast.success('Movie deleted successfully');
      setDeleteDialogOpen(false);
      setMovieToDelete(null);
    } catch (error) {
      toast.error('Failed to delete movie');
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Movies</h1>
        <Button onClick={openCreateModal} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Movie
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search movies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-muted"
        />
      </div>

      {/* Movies Table */}
      <Card className="glass">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : filteredMovies && filteredMovies.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>Premium</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMovies.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {movie.poster_url && (
                          <img
                            src={movie.poster_url}
                            alt={movie.title}
                            className="w-10 h-14 rounded object-cover"
                          />
                        )}
                        {movie.title}
                      </div>
                    </TableCell>
                    <TableCell>{movie.category}</TableCell>
                    <TableCell>{movie.year}</TableCell>
                    <TableCell>{movie.resolution}</TableCell>
                    <TableCell>
                      {movie.is_premium && (
                        <Crown className="w-4 h-4 text-cg-gold" />
                      )}
                    </TableCell>
                    <TableCell>
                      {movie.is_featured && (
                        <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          Featured
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditModal(movie)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setMovieToDelete(movie);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              No movies found. Add your first movie!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass">
          <DialogHeader>
            <DialogTitle>
              {editingMovie ? 'Edit Movie' : 'Add New Movie'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-md bg-muted border border-border"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      year: parseInt(e.target.value) || null,
                    })
                  }
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="resolution">Resolution</Label>
                <select
                  id="resolution"
                  value={formData.resolution || '1080p'}
                  onChange={(e) =>
                    setFormData({ ...formData, resolution: e.target.value })
                  }
                  className="w-full h-10 px-3 rounded-md bg-muted border border-border"
                >
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="4K">4K</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="director">Director</Label>
                <Input
                  id="director"
                  value={formData.director || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, director: e.target.value })
                  }
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="file_size">File Size</Label>
                <Input
                  id="file_size"
                  value={formData.file_size || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, file_size: e.target.value })
                  }
                  placeholder="e.g., 2.5 GB"
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="actors">Actors (comma separated)</Label>
              <Input
                id="actors"
                value={actorsInput}
                onChange={(e) => setActorsInput(e.target.value)}
                placeholder="Actor 1, Actor 2, Actor 3"
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="bg-muted"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="poster_url">Poster URL</Label>
                <Input
                  id="poster_url"
                  value={formData.poster_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, poster_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backdrop_url">Backdrop URL</Label>
                <Input
                  id="backdrop_url"
                  value={formData.backdrop_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, backdrop_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stream_url">Stream URL</Label>
                <Input
                  id="stream_url"
                  value={formData.stream_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, stream_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telegram_url">Telegram URL</Label>
                <Input
                  id="telegram_url"
                  value={formData.telegram_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, telegram_url: e.target.value })
                  }
                  placeholder="https://t.me/..."
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="mega_url">MEGA URL</Label>
                <Input
                  id="mega_url"
                  value={formData.mega_url || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, mega_url: e.target.value })
                  }
                  placeholder="https://mega.nz/..."
                  className="bg-muted"
                />
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_premium"
                  checked={formData.is_premium}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_premium: checked })
                  }
                />
                <Label htmlFor="is_premium">Premium Content</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_featured: checked })
                  }
                />
                <Label htmlFor="is_featured">Featured on Home</Label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMovie.isPending || updateMovie.isPending}
              >
                {createMovie.isPending || updateMovie.isPending
                  ? 'Saving...'
                  : editingMovie
                  ? 'Update Movie'
                  : 'Create Movie'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Movie</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{movieToDelete?.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
