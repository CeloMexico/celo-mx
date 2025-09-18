"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { isModuleDone, markModuleDone } from "@/lib/progress";
import { moduleTokenId } from "@/lib/milestones";
import { useMilestoneNFT } from "@/hooks/useMilestoneNFT";
import { useAccount } from "wagmi";
import { useToast } from "@/components/ui/toast";

export default function ModuleProgress({
  courseSlug, moduleIndex
}:{ courseSlug:string; moduleIndex:number }) {
  const [done, setDone] = useState(false);
  const [txUrl, setTxUrl] = useState<string | null>(null);
  const [minting, setMinting] = useState(false);
  const { hasBadge, claimBadge } = useMilestoneNFT();
  const { isConnected } = useAccount();
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;
    // Local state first
    if (isModuleDone(courseSlug, moduleIndex)) setDone(true);
    // Try on-chain verification (best-effort)
    (async () => {
      const tokenId = moduleTokenId(courseSlug, moduleIndex);
      const owned = await hasBadge(tokenId).catch(() => false);
      if (mounted && owned) setDone(true);
    })();
    return () => { mounted = false; };
  }, [courseSlug, moduleIndex, hasBadge]);

  async function completeAndMint() {
    if (!isConnected) {
      toast({ title: "Conecta tu wallet", description: "Necesitas una wallet para reclamar el hito.", variant: "default" });
      return;
    }
    try {
      setMinting(true);
      const tokenId = moduleTokenId(courseSlug, moduleIndex);
      const { hash, url } = await claimBadge(tokenId);
      setTxUrl(url || null);
      // Optimistic: marcar localmente
      markModuleDone(courseSlug, moduleIndex);
      setDone(true);
      toast({ title: "Hito reclamado", description: "Tu insignia NFT está minteándose en Celo." });
    } catch (e:any) {
      toast({ title: "No se pudo mintear", description: e?.shortMessage ?? e?.message ?? "Error desconocido", variant: "destructive" });
    } finally {
      setMinting(false);
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-emerald-600">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">Módulo completado</span>
        {txUrl && (
          <a href={txUrl} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs text-muted-foreground hover:underline">
            Ver transacción <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        )}
      </div>
    );
  }

  return (
    <Button onClick={completeAndMint} disabled={minting} className="w-full md:w-auto">
      {minting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Minteando…</>) : "Completar módulo y reclamar NFT"}
    </Button>
  );
}
