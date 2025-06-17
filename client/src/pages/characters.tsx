import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  Crown,
  ArrowLeft,
  Sparkles,
  Heart,
  Settings,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { CustomCharacter } from "@shared/schema";

const characterSchema = z.object({
  name: z.string().min(1, "Character name is required").max(50, "Name must be under 50 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(200, "Description must be under 200 characters"),
  appearance: z.string().min(10, "Appearance description must be at least 10 characters").max(300, "Appearance must be under 300 characters"),
  personality: z.string().min(10, "Personality description must be at least 10 characters").max(300, "Personality must be under 300 characters"),
  role: z.string().min(1, "Role is required"),
  species: z.string().default("human"),
  age: z.string().optional(),
  specialAbilities: z.string().optional(),
  backstory: z.string().optional(),
  favoriteThings: z.string().optional(),
});

type CharacterFormData = z.infer<typeof characterSchema>;

const CHARACTER_ROLES = [
  { value: "friend", label: "Friend", icon: "👫" },
  { value: "pet", label: "Pet", icon: "🐕" },
  { value: "mentor", label: "Mentor", icon: "🧙" },
  { value: "sibling", label: "Sibling", icon: "👶" },
  { value: "magical_creature", label: "Magical Creature", icon: "🦄" },
  { value: "superhero", label: "Superhero", icon: "🦸" },
  { value: "villain", label: "Villain", icon: "👹" },
  { value: "parent", label: "Parent Figure", icon: "👨‍👩‍👧" },
];

const CHARACTER_SPECIES = [
  { value: "human", label: "Human" },
  { value: "dog", label: "Dog" },
  { value: "cat", label: "Cat" },
  { value: "dragon", label: "Dragon" },
  { value: "fairy", label: "Fairy" },
  { value: "robot", label: "Robot" },
  { value: "alien", label: "Alien" },
  { value: "other", label: "Other" },
];

const CHARACTER_AGES = [
  { value: "baby", label: "Baby" },
  { value: "child", label: "Child" },
  { value: "teenager", label: "Teenager" },
  { value: "adult", label: "Adult" },
  { value: "elderly", label: "Elderly" },
  { value: "timeless", label: "Timeless" },
];

function CharacterCard({ character, onEdit, onDelete }: { 
  character: CustomCharacter, 
  onEdit: (character: CustomCharacter) => void,
  onDelete: (id: number) => void 
}) {
  const roleInfo = CHARACTER_ROLES.find(r => r.value === character.role);
  
  return (
    <Card className="hover:shadow-lg transition-shadow group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xl">
              {roleInfo?.icon || "👤"}
            </div>
            <div>
              <CardTitle className="text-lg">{character.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {roleInfo?.label || character.role}
                </Badge>
                {character.species !== "human" && (
                  <Badge variant="outline" className="text-xs">
                    {CHARACTER_SPECIES.find(s => s.value === character.species)?.label || character.species}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(character)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(character.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-3">{character.description}</p>
        <div className="space-y-2 text-xs text-gray-500">
          <div><strong>Appearance:</strong> {character.appearance}</div>
          <div><strong>Personality:</strong> {character.personality}</div>
          {character.specialAbilities && (
            <div><strong>Special Abilities:</strong> {character.specialAbilities}</div>
          )}
          {character.favoriteThings && (
            <div><strong>Loves:</strong> {character.favoriteThings}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function CharacterForm({ character, onSuccess, onCancel }: {
  character?: CustomCharacter,
  onSuccess: () => void,
  onCancel: () => void
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const form = useForm<CharacterFormData>({
    resolver: zodResolver(characterSchema),
    defaultValues: {
      name: character?.name || "",
      description: character?.description || "",
      appearance: character?.appearance || "",
      personality: character?.personality || "",
      role: character?.role || "",
      species: character?.species || "human",
      age: character?.age || "",
      specialAbilities: character?.specialAbilities || "",
      backstory: character?.backstory || "",
      favoriteThings: character?.favoriteThings || "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CharacterFormData) => {
      const response = await apiRequest("/api/characters", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({ title: "Character created successfully!" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to create character", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: CharacterFormData) => {
      const response = await apiRequest(`/api/characters/${character!.id}`, "PATCH", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({ title: "Character updated successfully!" });
      onSuccess();
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update character", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const onSubmit = (data: CharacterFormData) => {
    if (character) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Character Name *</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Luna the Dragon" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CHARACTER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.icon} {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="A brief description of who this character is..."
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="species"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Species</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CHARACTER_SPECIES.map((species) => (
                      <SelectItem key={species.value} value={species.value}>
                        {species.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="age"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CHARACTER_AGES.map((age) => (
                      <SelectItem key={age.value} value={age.value}>
                        {age.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="appearance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Appearance *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe how this character looks..."
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="personality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Personality *</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Describe this character's personality traits..."
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="specialAbilities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Abilities</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any magical powers or special skills..."
                  className="min-h-[60px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="favoriteThings"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Favorite Things</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="What does this character love most..."
                  className="min-h-[60px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="backstory"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Backstory</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="The character's history and background..."
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Saving..." : character ? "Update Character" : "Create Character"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default function CharactersPage() {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<CustomCharacter | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: characters, isLoading, error } = useQuery<CustomCharacter[]>({
    queryKey: ["/api/characters"],
  });

  const { data: tierInfo } = useQuery<{tier: string; status: string}>({
    queryKey: ["/api/user/tier-info"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest(`/api/characters/${id}`, "DELETE");
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      toast({ title: "Character deleted successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to delete character", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this character? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  const handleEdit = (character: CustomCharacter) => {
    setEditingCharacter(character);
  };

  const handleFormSuccess = () => {
    setShowCreateDialog(false);
    setEditingCharacter(null);
  };

  const handleFormCancel = () => {
    setShowCreateDialog(false);
    setEditingCharacter(null);
  };

  // Check if user has access to custom characters
  if (tierInfo && tierInfo.tier !== "family") {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Custom Characters</h1>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <CardTitle className="text-2xl">Upgrade to Storytime Pro</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Custom characters are exclusively available with the Storytime Pro plan. 
              Create unique characters that can appear across multiple stories!
            </p>
            <div className="bg-purple-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-center space-x-2 text-purple-700">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">What you'll get:</span>
              </div>
              <ul className="text-sm text-purple-600 space-y-1">
                <li>• Create unlimited custom characters</li>
                <li>• Consistent character development across stories</li>
                <li>• Build ongoing story arcs with your characters</li>
                <li>• Family-specific characters that grow with your child</li>
              </ul>
            </div>
            <Link href="/pricing">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Custom Characters</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Custom Characters</h1>
        </div>
        <Card className="max-w-lg mx-auto">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">Failed to load characters</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Custom Characters</h1>
            <p className="text-gray-600">Create unique characters for your stories</p>
          </div>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Character
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Character</DialogTitle>
            </DialogHeader>
            <CharacterForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
          </DialogContent>
        </Dialog>
      </div>

      {characters && characters.length === 0 ? (
        <Card className="max-w-2xl mx-auto">
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Characters Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first custom character to bring unique personalities to your stories!
            </p>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Character
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {characters?.map((character: CustomCharacter) => (
            <CharacterCard
              key={character.id}
              character={character}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingCharacter} onOpenChange={(open) => !open && setEditingCharacter(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Character</DialogTitle>
          </DialogHeader>
          {editingCharacter && (
            <CharacterForm 
              character={editingCharacter} 
              onSuccess={handleFormSuccess} 
              onCancel={handleFormCancel} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}