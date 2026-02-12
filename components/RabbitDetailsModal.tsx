'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RabbitForm, IBreedOption, ICageOption, RabbitFormData } from './RabbitForm';
import { RabbitTableData } from '@/app/rabbits/types';
import { Edit2, Info, Rabbit as RabbitIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

interface RabbitDetailsModalProps {
  rabbit: RabbitTableData;
  breeds: IBreedOption[];
  cages: ICageOption[];
  onEdit?: (data: RabbitFormData) => Promise<void> | void;
  trigger?: React.ReactNode;
}

const getStatusVariant = (status: string): 'default' | 'secondary' | 'outline' | 'destructive' => {
  switch (status) {
    case 'Active':
      return 'default';
    case 'Sold':
      return 'secondary';
    case 'Deceased':
    case 'Culled':
      return 'destructive';
    default:
      return 'outline';
  }
};

export function RabbitDetailsModal({
  rabbit,
  breeds,
  cages,
  onEdit,
  trigger,
}: RabbitDetailsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = async (data: RabbitFormData) => {
    if (onEdit) {
      await onEdit(data);
      setIsEditing(false);
      setIsOpen(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger ? (
          trigger
        ) : (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Info className="h-4 w-4" />
            <span className="sr-only">View details for {rabbit.tag_id}</span>
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <RabbitIcon className="h-5 w-5" />
            {rabbit.full_name || rabbit.tag_id}
          </SheetTitle>
          <SheetDescription>Rabbit ID: {rabbit._id}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {isEditing ? (
            <RabbitForm
              breeds={breeds}
              cages={cages}
              onSubmit={handleEdit}
              onCancel={() => setIsEditing(false)}
              initialData={{
                ear_tag_id: rabbit.tag_id,
                name: '',
                gender: rabbit.gender,
                date_of_birth: new Date().toISOString().split('T')[0],
                breed_id: '',
                current_cage_id: '',
                status: rabbit.status,
                is_pregnant: rabbit.is_pregnant,
              }}
            />
          ) : (
            <>
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="health">Health & Status</TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {/* Basic Info */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Tag ID</p>
                            <p className="text-lg font-mono">{rabbit.tag_id}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Breed</p>
                            <p className="text-sm">{rabbit.breed_name}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Gender</p>
                            <p className={`text-sm font-medium ${rabbit.gender === 'Male' ? 'text-blue-500' : 'text-pink-500'}`}>
                              {rabbit.gender}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Age & Location */}
                    <Card>
                      <CardContent className="pt-6">
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Age</p>
                            <p className="text-sm font-mono">{rabbit.age_in_days} days</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Maturity Stage</p>
                            <p className="text-sm">{rabbit.maturity_status}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Cage</p>
                            <p className="text-sm">{rabbit.cage_id}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="health" className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Status</p>
                          <Badge variant={getStatusVariant(rabbit.status)} className="capitalize">
                            {rabbit.status}
                            {rabbit.status === 'Active' && rabbit.is_pregnant && (
                              <span className="ml-1">🤰</span>
                            )}
                          </Badge>
                        </div>

                        {rabbit.status === 'Active' && (
                          <div>
                            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pregnancy Status</p>
                            <p className="text-sm">
                              {rabbit.is_pregnant ? (
                                <span className="text-amber-600 font-medium">Pregnant</span>
                              ) : (
                                <span className="text-green-600 font-medium">Not pregnant</span>
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4">
                <Button onClick={() => setIsEditing(true)} variant="outline" className="flex-1">
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
