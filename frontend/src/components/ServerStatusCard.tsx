import { useGetCachedStatus, useGetServerAddress } from '../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Server } from 'lucide-react';

export default function ServerStatusCard() {
  const { data: status } = useGetCachedStatus();
  const { data: serverAddress } = useGetServerAddress();

  return (
    <Card className="border-minecraft-brown bg-card/80 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Server className="w-5 h-5" />
          Server Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80">Status:</span>
          <Badge
            variant={status?.online ? 'default' : 'destructive'}
            className={status?.online ? 'bg-minecraft-green' : ''}
          >
            {status?.online ? (
              <>
                <img src="/assets/generated/status-online-transparent.dim_32x32.png" alt="" className="w-4 h-4 mr-1" />
                Online
              </>
            ) : (
              <>
                <img src="/assets/generated/status-offline-transparent.dim_32x32.png" alt="" className="w-4 h-4 mr-1" />
                Offline
              </>
            )}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-white/80 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Players:
          </span>
          <span className="font-semibold text-minecraft-green">
            {status?.playerCount !== undefined ? Number(status.playerCount) : '0'}
          </span>
        </div>
        <div className="pt-2 border-t border-border/40">
          <p className="text-xs text-white/70">Server IP:</p>
          <code className="text-sm font-mono bg-muted px-2 py-1 rounded mt-1 block text-white">
            {serverAddress || 'Loading...'}
          </code>
        </div>
      </CardContent>
    </Card>
  );
}
