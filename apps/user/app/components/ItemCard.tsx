import { Link } from "react-router";
import { Card, CardContent, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { MapPin, Star, Sparkles } from "lucide-react";
import { type Item } from "../services/api";

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const conditionColors = {
    'New': 'bg-green-100 text-green-800 border-green-200',
    'Excellent': 'bg-blue-100 text-blue-800 border-blue-200',
    'Good': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Fair': 'bg-orange-100 text-orange-800 border-orange-200',
  };
  const itemId = item.id || item._id;
  const content = (
    <Card className="h-full overflow-hidden transition-all hover:shadow-lg hover:border-primary/50">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img 
          src={item.images[0]} 
          alt={item.title}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {item.isFeatured && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-primary text-white gap-1">
              <Sparkles className="h-3 w-3" />
              Featured
            </Badge>
          </div>
        )}
        {!item.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge variant="destructive">Currently Unavailable</Badge>
          </div>
        )}
      </div>
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
              {item.title}
            </h3>
          </div>
          <Badge variant="outline" className={conditionColors[item.condition]}>
            {item.condition}
          </Badge>
        </div>
        
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {item.description}
        </p>
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          <MapPin className="h-3 w-3" />
          <span className="line-clamp-1">{item.location}</span>
        </div>
        
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={item.ownerAvatar} alt={item.ownerName} />
              <AvatarFallback className="text-xs">{item.ownerName.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{item.ownerRating}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-right whitespace-nowrap">
            <span className="font-semibold text-primary">₱{item.rentalFeePerDay}/day</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">Deposit: ₱{item.deposit}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!itemId) {
    return <div className="block group">{content}</div>;
  }

  return (
    <Link to={`/item/${itemId}`} className="block group">
      {content}
    </Link>
  );
}
