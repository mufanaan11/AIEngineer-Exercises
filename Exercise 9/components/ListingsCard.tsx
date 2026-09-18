import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type Listing = {
    title: string;
    source: string;
    price: string;
    rating?: number;
    ratingCount?: number;
    delivery?: string;
    link: string;
    imageUrl?: string;
};

type ListingsCardProps = {
    listings: Listing[];
};

const ListingsCard = ({ listings }: ListingsCardProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Listings ({listings.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 max-h-96 overflow-auto">
                    {listings.map((listing, i) => (
                        <div key={i} className="border p-3 rounded flex gap-3">
                            {listing.imageUrl && (
                                <img
                                    src={listing.imageUrl}
                                    alt={listing.title}
                                    className="w-20 h-20 object-cover rounded flex-shrink-0"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2">{listing.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-semibold text-gray-900">{listing.price}</span>
                                    {listing.rating !== undefined && (
                                        <span className="text-xs text-gray-500">
                                            ⭐ {listing.rating}{listing.ratingCount ? ` (${listing.ratingCount})` : ''}
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-500 mt-1 inline-block">{listing.source}</span>
                                {listing.delivery && (
                                    <p className="text-xs text-gray-500">{listing.delivery}</p>
                                )}
                                <a
                                    href={listing.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                >
                                    View Deal →
                                </a>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export default ListingsCard
