import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/useAuth';
import { Header } from '../components/Header';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { AvatarCropModal } from '../components/AvatarCropModal';
import { fetchItems, updateUserProfile, type Item } from '../services/api';
import { Calendar, MapPin, Star, Package, Edit, Loader2, Camera, Phone } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

export default function Account() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [phone, setPhone] = useState(user?.phone || '');
  const [userListings, setUserListings] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState<string>('');
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const loadUserListings = async () => {
      try {
        setIsLoading(true);
        const allItems = await fetchItems();
        // Filter items by owner ID
        const userItems = allItems.filter(item => item.ownerId === user?.id);
        setUserListings(userItems);
      } catch (error) {
        console.error("Failed to fetch user listings:", error);
        toast.error("Failed to load listings");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (user?.id) {
      loadUserListings();
    }
  }, [user?.id]);

  useEffect(() => {
    // Sync local state when user updates (e.g., after avatar change)
    if (user?.avatar && !avatarFile) {
      setAvatar(user.avatar);
    }
    if (user?.name) {
      setName(user.name);
    }
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user?.avatar, user?.name, user?.phone, avatarFile]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'profile' || tab === 'listings') {
      setActiveTab(tab);
    }
  }, [searchParams]);


  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageForCrop(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCropSave = async (croppedImage: string) => {
    // Use _id if id is not available (MongoDB returns _id)
    const userId = user?.id || user?._id;
    
    if (!userId) {
      toast.error('User not found');
      return;
    }

    try {
      const updatedUser = await updateUserProfile({
        avatar: croppedImage,
      });

      if (setUser) {
        setUser(updatedUser);
      }

      toast.success('Profile picture updated!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile picture';
      toast.error(message);
      console.error('Failed to update avatar:', error);
    }
  };

  const validatePhoneNumber = (phoneNumber: string): boolean => {
    if (!phoneNumber.trim()) return true; // Empty is allowed
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phoneNumber) || /^\d{7,}$/.test(phoneNumber.replace(/[^\d]/g, ''));
  };

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    if (!name.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    if (phone.trim() && !validatePhoneNumber(phone)) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setIsSaving(true);
    try {
      const updateData: Record<string, string> = { name };
      
      // If a new avatar file was selected, use it; otherwise, keep the current one
      if (avatarFile) {
        updateData.avatar = avatar;
      } else if (avatar !== user.avatar) {
        updateData.avatar = avatar;
      }

      if (phone !== (user?.phone || '')) {
        updateData.phone = phone;
      }

      const updatedUser = await updateUserProfile(updateData);
      
      // Update the auth context with new user data
      if (setUser) {
        setUser(updatedUser);
      }

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setAvatarFile(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      toast.error(message);
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setName(user?.name || '');
    setAvatar(user?.avatar || '');
    setPhone(user?.phone || '');
    setAvatarFile(null);
    setIsEditing(false);
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl font-semibold mb-8">Account Settings</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="listings">My Listings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <CardDescription>
                    Update your account details and public profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div 
                      className="relative cursor-pointer group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Avatar className="h-24 w-24 ring-2 ring-transparent group-hover:ring-primary transition-all">
                        <AvatarImage src={avatar || user.avatar} alt={user.name} />
                        <AvatarFallback className="text-2xl">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-full transition-colors flex items-center justify-center">
                        <Camera className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      {isUploadingAvatar && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploadingAvatar}
                      title="Upload profile picture"
                    />
                    <div>
                      <h3 className="text-lg font-semibold">{user.name}</h3>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-primary text-primary" />
                          <span className="text-sm font-medium">{user.rating.toFixed(1)}</span>
                          <span className="text-sm text-muted-foreground">({user.reviewCount} reviews)</span>
                        </div>
                        {user.isAdmin && (
                          <Badge variant="secondary">Admin</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium">Personal Details</h4>
                      {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleCancel} disabled={isSaving}>
                            Cancel
                          </Button>
                          <Button size="sm" onClick={handleSave} disabled={isSaving}>
                            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            {isSaving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={user.email}
                          disabled
                          className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                          Contact support to change your email address
                        </p>
                      </div>

                      <div className="grid gap-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="e.g. +63 912 345 6789"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value.replace(/\s+/g, ''))}
                          disabled={!isEditing}
                        />
                      </div>

                      <div className="grid gap-2">
                        <Label>Member Since</Label>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          {new Date(user.joinDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                  <CardDescription>
                    Your activity on Lendly
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Package className="h-4 w-4" />
                        <span className="text-sm">Total Listings</span>
                      </div>
                      <p className="text-3xl font-semibold">{userListings.length}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="h-4 w-4" />
                        <span className="text-sm">Average Rating</span>
                      </div>
                      <p className="text-3xl font-semibold">{user.rating.toFixed(1)}</p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span className="text-sm">Total Reviews</span>
                      </div>
                      <p className="text-3xl font-semibold">{user.reviewCount}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="listings" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>My Listings</CardTitle>
                      <CardDescription>
                        Items you've listed on Lendly
                      </CardDescription>
                    </div>
                    <Button onClick={() => navigate('/add-listing')}>
                      Add New Listing
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {userListings.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No listings yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Start lending by creating your first item listing
                      </p>
                      <Button onClick={() => navigate('/add-listing')}>
                        Create First Listing
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {userListings.map((item) => (
                        <div
                          key={item.id || item._id}
                          className="flex gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => {
                            const itemId = item.id || item._id;
                            if (itemId) {
                              navigate(`/item/${itemId}`);
                            }
                          }}
                        >
                          <img
                            src={item.images[0]}
                            alt={item.title}
                            className="w-24 h-24 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-semibold">{item.title}</h3>
                                  <span className="font-semibold text-primary">₱{item.rentalFeePerDay}/day</span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                  {item.description}
                                </p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {item.location}
                                  </span>
                                  <Badge variant="outline">{item.category}</Badge>
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm text-muted-foreground">Deposit: ₱{item.deposit}</p>
                                <Badge 
                                  variant={item.available ? "default" : "secondary"}
                                  className="mt-2"
                                >
                                  {item.available ? "Available" : "Unavailable"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <AvatarCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        onSave={handleCropSave}
        imageSrc={selectedImageForCrop}
      />
    </div>
  );
}
