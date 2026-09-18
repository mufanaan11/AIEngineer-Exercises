import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

type Comparison = {
    source: string;
    price: string;
    rating?: number;
    pros: string[];
    cons: string[];
    valueScore: number;
};

type ComparisonCardProps = {
    comparisons: Comparison[];
};

const ComparisonCard = ({ comparisons }: ComparisonCardProps) => {
    const sorted = [...comparisons].sort((a, b) => b.valueScore - a.valueScore);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Comparison ({comparisons.length})</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-3 max-h-96 overflow-auto">
                    {sorted.map((c, i) => (
                        <div key={i} className="border p-3 rounded">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium">{c.source}</span>
                                <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                                    Value: {(c.valueScore * 100).toFixed(0)}%
                                </span>
                            </div>
                            <p className="text-sm text-gray-900 font-semibold">{c.price}</p>
                            {c.pros.length > 0 && (
                                <ul className="text-xs text-green-700 mt-1 list-disc list-inside">
                                    {c.pros.map((p, j) => <li key={j}>{p}</li>)}
                                </ul>
                            )}
                            {c.cons.length > 0 && (
                                <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                                    {c.cons.map((cn, j) => <li key={j}>{cn}</li>)}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}

export default ComparisonCard
