import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus, Users, Crown, Lock } from "lucide-react";
import { Link } from "wouter";
import type { CustomCharacter } from "@shared/schema";

interface CharacterSelectionStepProps {
  selectedCharacters: string[];
  onCharactersChange: (characters: string[]) => void;
  tierInfo?: { tier: string; canAccessCustomCharacters: boolean };
}

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

function CharacterCard({ character, isSelected, onToggle }: {
  character: CustomCharacter;
  isSelected: boolean;
  onToggle: (id: string) => void;
}) {
  const roleInfo = CHARACTER_ROLES.find(r => r.value === character.role);
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : ''
      }`}
      onClick={() => onToggle(character.id.toString())}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-lg">
              {roleInfo?.icon || "👤"}
            </div>
            <div>
              <CardTitle className="text-base">{character.name}</CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {roleInfo?.label || character.role}
                </Badge>
                {character.species !== "human" && (
                  <Badge variant="outline" className="text-xs">
                    {character.species}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <Checkbox
            checked={isSelected}
            onChange={() => onToggle(character.id.toString())}
            className="mt-1"
          />
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 mb-2">{character.description}</p>
        <div className="text-xs text-gray-500">
          <div><strong>Personality:</strong> {character.personality}</div>
          {character.specialAbilities && (
            <div className="mt-1"><strong>Special Abilities:</strong> {character.specialAbilities}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CharacterSelectionStep({
  selectedCharacters,
  onCharactersChange,
  tierInfo,
}: CharacterSelectionStepProps) {
  const { data: characters, isLoading, error } = useQuery<CustomCharacter[]>({
    queryKey: ["/api/characters"],
    enabled: tierInfo?.canAccessCustomCharacters || false,
  });

  const handleCharacterToggle = (characterId: string) => {
    const newSelection = selectedCharacters.includes(characterId)
      ? selectedCharacters.filter(id => id !== characterId)
      : [...selectedCharacters, characterId];
    onCharactersChange(newSelection);
  };

  // If user doesn't have access to custom characters
  if (!tierInfo?.canAccessCustomCharacters) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Custom Characters</h2>
          <p className="text-gray-600">Include your unique characters in this story</p>
        </div>

        <Card className="max-w-lg mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="h-8 w-8 text-white" />
            </div>
            <CardTitle>Upgrade to Storytime Pro</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              Custom characters are available with the Storytime Pro plan. Create unique characters that can appear across multiple stories!
            </p>
            <div className="bg-purple-50 p-4 rounded-lg space-y-2">
              <ul className="text-sm text-purple-600 space-y-1">
                <li>• Create unlimited custom characters</li>
                <li>• Consistent character development</li>
                <li>• Build ongoing story arcs</li>
                <li>• Family-specific characters</li>
              </ul>
            </div>
            <div className="flex space-x-2 justify-center">
              <Link href="/pricing">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600">
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>
              </Link>
              <Button variant="outline" onClick={() => onCharactersChange([])}>
                Skip for Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Custom Characters</h2>
          <p className="text-gray-600">Include your unique characters in this story</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
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
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Custom Characters</h2>
          <p className="text-gray-600">Include your unique characters in this story</p>
        </div>
        <Card className="max-w-lg mx-auto">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">Failed to load characters</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Add Custom Characters</h2>
        <p className="text-gray-600">
          {characters && characters.length > 0 
            ? "Select characters to include in your story" 
            : "Create your first custom character"}
        </p>
      </div>

      {characters && characters.length === 0 ? (
        <Card className="max-w-lg mx-auto">
          <CardContent className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No Characters Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first custom character to bring unique personalities to your stories!
            </p>
            <div className="flex space-x-2 justify-center">
              <Link href="/characters">
                <Button className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Character
                </Button>
              </Link>
              <Button variant="outline" onClick={() => onCharactersChange([])}>
                Skip for Now
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {characters?.map((character) => (
              <CharacterCard
                key={character.id}
                character={character}
                isSelected={selectedCharacters.includes(character.id.toString())}
                onToggle={handleCharacterToggle}
              />
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {selectedCharacters.length > 0 && (
                <span>{selectedCharacters.length} character{selectedCharacters.length !== 1 ? 's' : ''} selected</span>
              )}
            </div>
            <div className="flex space-x-2">
              <Link href="/characters">
                <Button variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Character
                </Button>
              </Link>
              <Button onClick={() => onCharactersChange([])}>
                Continue without Characters
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}