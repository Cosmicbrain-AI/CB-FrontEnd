import { useState } from "react";
import { Star, Download, Users, Eye, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface SkillsetVLA {
  id: string;
  name: string;
  description: string;
  category: string;
  rating: number;
  downloads: number;
  users: number;
  author: string;
  robotTypes: string[];
  tags: string[];
  price: string;
  complexity: 'Beginner' | 'Intermediate' | 'Advanced';
  lastUpdated: string;
  image: string;
}

const SAMPLE_VLAS: SkillsetVLA[] = [
  {
    id: "1",
    name: "Precision Assembly Pro",
    description: "Advanced robotic arm control for electronic component assembly with sub-millimeter precision",
    category: "Manufacturing",
    rating: 4.8,
    downloads: 12400,
    users: 3200,
    author: "RoboTech Labs",
    robotTypes: ["KUKA KR3", "ABB IRB120", "Universal Robots UR5e"],
    tags: ["assembly", "precision", "electronics"],
    price: "$149",
    complexity: "Advanced",
    lastUpdated: "2 days ago",
    image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=200&h=200&fit=crop&crop=center"
  },
  {
    id: "2",
    name: "Smart Warehouse Navigator",
    description: "Autonomous navigation and inventory management for warehouse robotics",
    category: "Logistics",
    rating: 4.6,
    downloads: 8900,
    users: 2100,
    author: "LogiBot Solutions",
    robotTypes: ["Amazon Kiva", "Fetch Robotics", "6 River Chuck"],
    tags: ["navigation", "inventory", "warehouse"],
    price: "Free",
    complexity: "Intermediate",
    lastUpdated: "1 week ago",
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=200&h=200&fit=crop&crop=center"
  },
  {
    id: "3",
    name: "Culinary Assistant Master",
    description: "Complete cooking workflow for restaurant and home kitchen automation",
    category: "Service",
    rating: 4.9,
    downloads: 5600,
    users: 890,
    author: "Chef Robotics",
    robotTypes: ["Moley Kitchen Robot", "Flippy", "Custom Arm"],
    tags: ["cooking", "food-prep", "restaurant"],
    price: "$299",
    complexity: "Advanced",
    lastUpdated: "3 days ago",
    image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&h=200&fit=crop&crop=center"
  },
  {
    id: "4",
    name: "Home Cleaning Optimizer",
    description: "Intelligent cleaning patterns and obstacle avoidance for domestic robots",
    category: "Domestic",
    rating: 4.4,
    downloads: 15600,
    users: 4300,
    author: "CleanTech AI",
    robotTypes: ["Roomba", "Neato", "Shark IQ"],
    tags: ["cleaning", "navigation", "home"],
    price: "$49",
    complexity: "Beginner",
    lastUpdated: "5 days ago",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=200&fit=crop&crop=center"
  },
  {
    id: "5",
    name: "Medical Surgery Assistant",
    description: "Precision surgical assistance with haptic feedback and safety protocols",
    category: "Healthcare",
    rating: 4.7,
    downloads: 2100,
    users: 340,
    author: "MedBot Research",
    robotTypes: ["da Vinci Xi", "ROSA Knee", "Mako SmartRobotics"],
    tags: ["surgery", "medical", "precision"],
    price: "$899",
    complexity: "Advanced",
    lastUpdated: "1 day ago",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=200&h=200&fit=crop&crop=center"
  },
  {
    id: "6",
    name: "Garden Care Pro",
    description: "Automated plant care, watering, and harvesting for agricultural robots",
    category: "Agriculture",
    rating: 4.3,
    downloads: 7200,
    users: 1500,
    author: "AgriBot Corp",
    robotTypes: ["FarmBot Genesis", "Iron Ox", "Harvest CROO"],
    tags: ["agriculture", "watering", "harvesting"],
    price: "$89",
    complexity: "Intermediate",
    lastUpdated: "1 week ago",
    image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=200&h=200&fit=crop&crop=center"
  }
];

export default function SkillsetMarketplace() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("rating");
  const [complexityFilter, setComplexityFilter] = useState("all");

  const filteredVLAs = SAMPLE_VLAS
    .filter(vla => {
      const matchesSearch = vla.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vla.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           vla.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === "all" || vla.category === categoryFilter;
      const matchesComplexity = complexityFilter === "all" || vla.complexity === complexityFilter;
      return matchesSearch && matchesCategory && matchesComplexity;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return b.rating - a.rating;
        case "downloads":
          return b.downloads - a.downloads;
        case "users":
          return b.users - a.users;
        case "recent":
          return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        default:
          return 0;
      }
    });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={12}
        className={i < Math.floor(rating) ? "text-yellow-400 fill-current" : "text-gray-300"}
      />
    ));
  };

  return (
    <div className="mt-8" id="marketplace">
      <Card className="shadow-sm border border-gray-200">
        <CardHeader className="bg-gradient-to-r from-secondary/5 to-accent/5 border-b border-gray-200">
          <CardTitle className="flex items-center text-gray-900">
            <Eye className="text-secondary mr-2" size={20} />
            Skillset Marketplace
          </CardTitle>
          <p className="text-sm text-gray-600">Discover and download VLA training models from the community</p>
        </CardHeader>
        
        <CardContent className="p-6">
          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <Input
                  placeholder="Search skillsets, tags, or robot types..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Logistics">Logistics</SelectItem>
                  <SelectItem value="Service">Service</SelectItem>
                  <SelectItem value="Domestic">Domestic</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Agriculture">Agriculture</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={complexityFilter} onValueChange={setComplexityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rating">Top Rated</SelectItem>
                  <SelectItem value="downloads">Most Downloaded</SelectItem>
                  <SelectItem value="users">Most Users</SelectItem>
                  <SelectItem value="recent">Recently Updated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* VLA Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVLAs.map((vla) => (
              <Card key={vla.id} className="border border-gray-200 hover:shadow-md transition-shadow overflow-hidden">
                <div className="relative">
                  <img 
                    src={vla.image} 
                    alt={vla.name}
                    className="w-full h-32 object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <Badge variant={vla.complexity === 'Beginner' ? 'secondary' : vla.complexity === 'Intermediate' ? 'default' : 'destructive'} className="text-xs">
                      {vla.complexity}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{vla.name}</h3>
                      <p className="text-xs text-gray-600 mb-2">by {vla.author}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">{vla.price}</div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{vla.description}</p>
                  
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-1">
                      {renderStars(vla.rating)}
                      <span className="text-xs text-gray-600 ml-1">{vla.rating}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <Download size={12} />
                      <span>{vla.downloads.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <Users size={12} />
                      <span>{vla.users.toLocaleString()}</span>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Compatible Robots:</p>
                    <div className="flex flex-wrap gap-1">
                      {vla.robotTypes.slice(0, 2).map((robot, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {robot}
                        </Badge>
                      ))}
                      {vla.robotTypes.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{vla.robotTypes.length - 2} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-3">
                    {vla.tags.map((tag, idx) => (
                      <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-500">Updated {vla.lastUpdated}</span>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" className="text-xs">
                        Preview
                      </Button>
                      <Button size="sm" className="text-xs bg-secondary hover:bg-secondary/90">
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {filteredVLAs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No skillsets found matching your criteria.</p>
              <p className="text-sm mt-1">Try adjusting your search or filters.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}