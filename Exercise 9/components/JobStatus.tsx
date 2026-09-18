import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

type JobStatusProps = {
    status: 'running' | 'success' | 'failed';
    listings?: number;
    comparisons?: number;
    recommendation?: boolean;
  };

const JobStatus = ({ status, listings, comparisons, recommendation }: JobStatusProps) => {
  return (

    <Card className="mb-6">
    <CardHeader>
      <div className="flex items-center justify-between">
        <CardTitle>Job Status</CardTitle>
        <span className={`text-sm font-medium px-3 py-1 rounded ${
          status === 'running' ? 'bg-blue-100 text-blue-700' :
          status === 'success' ? 'bg-green-100 text-green-700' :
          'bg-red-100 text-red-700'
        }`}>
          {status === 'running' ? '🔄 Running' :
           status === 'success' ? '✅ Complete' :
           '❌ Failed'}
        </span>
      </div>
    </CardHeader>


    <CardContent>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Listings Found:</span>
            <span className="font-medium">{listings}</span>
          </div>
          <div className="flex justify-between">
            <span>Listings Compared:</span>
            <span className="font-medium">{comparisons}</span>
          </div>
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-between">
              <span className="font-medium">Recommendation Ready:</span>
              <span className={recommendation ? 'text-green-600' : 'text-gray-500'}>
                {recommendation ? '✓ Yes' : '—'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default JobStatus
