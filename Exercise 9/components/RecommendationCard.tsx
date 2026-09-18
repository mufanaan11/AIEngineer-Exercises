import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type Recommendation = {
    bestSource: string;
    price: string;
    link: string;
    reasoning: string;
};

type RecommendationCardProps = {
    recommendation: Recommendation | null;
};

const RecommendationCard = ({ recommendation }: RecommendationCardProps) => {
    if (!recommendation) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Recommendation</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-gray-500">No recommendation yet</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-green-300 bg-green-50">
            <CardHeader>
                <CardTitle>🏆 Best Pick: {recommendation.bestSource}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-2xl font-bold text-gray-900">{recommendation.price}</p>
                <p className="text-sm text-gray-700">{recommendation.reasoning}</p>
                <a
                    href={recommendation.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-green-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-green-700"
                >
                    Buy Now →
                </a>
            </CardContent>
        </Card>
    )
}

export default RecommendationCard
