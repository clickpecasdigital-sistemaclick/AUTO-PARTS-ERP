import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Car, Package, Search } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useVehicleMakes, useVehicleModels, useVehicleVersions } from '../hooks/useCatalogs';
import { catalogsService } from '../services/catalogs.service';
import { formatCurrencyBRL } from '@/utils/formatters';

/**
 * Catálogo de Aplicações — pesquisa "por veículo" (Montadora → Modelo →
 * Versão) das peças cadastradas com aplicação veicular. Reaproveita os
 * mesmos catálogos globais (VehicleMake/Model/Version) já usados no
 * cadastro de Produto e na busca do PDV por placa — aqui é a versão
 * "navegável", pra consulta rápida sem precisar de uma venda em
 * andamento.
 */
export default function VehicleApplicationsCatalogPage() {
  const [makeId, setMakeId] = useState<string>('');
  const [modelId, setModelId] = useState<string>('');
  const [versionId, setVersionId] = useState<string>('');

  const { data: makes, isLoading: loadingMakes } = useVehicleMakes();
  const { data: models, isLoading: loadingModels } = useVehicleModels(makeId || undefined);
  const { data: versions, isLoading: loadingVersions } = useVehicleVersions(modelId || undefined);

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['catalogs', 'vehicle-applications', versionId],
    queryFn: () => catalogsService.vehicleApplications(versionId),
    enabled: !!versionId,
  });

  function handleMakeChange(value: string) {
    setMakeId(value);
    setModelId('');
    setVersionId('');
  }

  function handleModelChange(value: string) {
    setModelId(value);
    setVersionId('');
  }

  return (
    <div>
      <PageHeader
        title="Catálogo de Aplicações"
        description="Encontre as peças compatíveis com um veículo específico — Montadora, Modelo e Versão/Motorização."
      />

      <Card>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Montadora</label>
            <Select onValueChange={handleMakeChange} value={makeId} disabled={loadingMakes}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione..." />
              </SelectTrigger>
              <SelectContent>
                {makes?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Modelo</label>
            <Select onValueChange={handleModelChange} value={modelId} disabled={!makeId || loadingModels}>
              <SelectTrigger>
                <SelectValue placeholder={makeId ? 'Selecione...' : 'Escolha a montadora primeiro'} />
              </SelectTrigger>
              <SelectContent>
                {models?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Versão / Motorização</label>
            <Select onValueChange={setVersionId} value={versionId} disabled={!modelId || loadingVersions}>
              <SelectTrigger>
                <SelectValue placeholder={modelId ? 'Selecione...' : 'Escolha o modelo primeiro'} />
              </SelectTrigger>
              <SelectContent>
                {versions?.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name} {v.yearStart}
                    {v.yearEnd ? `–${v.yearEnd}` : '+'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="mt-4">
        {!versionId ? (
          <EmptyState icon={Car} title="Escolha um veículo" description="Selecione montadora, modelo e versão para ver as peças compatíveis cadastradas." />
        ) : loadingProducts ? (
          <LoadingScreen fullScreen={false} />
        ) : !products || products.length === 0 ? (
          <EmptyState icon={Package} title="Nenhuma peça compatível cadastrada" description="Ainda não há produtos com essa aplicação veicular no seu catálogo." />
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              <Search className="mr-1 inline size-3.5" /> {products.length} peça(s) compatível(is) com o veículo selecionado
            </p>
            {products.map((p) => {
              const onHand = p.stocks.reduce((sum, s) => sum + Number(s.quantityOnHand), 0);
              const position = p.vehicleApplications[0]?.position;
              return (
                <Card key={p.id}>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div>
                      <p className="font-medium">{p.shortDescription}</p>
                      <p className="text-xs text-muted-foreground font-numeric">
                        Código: {p.internalCode} {p.barcode ? `· Barras: ${p.barcode}` : ''} {p.brand ? `· Marca: ${p.brand.name}` : ''}
                      </p>
                      {position && <Badge variant="outline" className="mt-1">{position}</Badge>}
                    </div>
                    <div className="text-right">
                      <p className="font-numeric font-semibold">{formatCurrencyBRL(Number(p.salePrice))}</p>
                      <p className={`text-xs font-numeric ${onHand > 0 ? 'text-success' : 'text-destructive'}`}>
                        {onHand > 0 ? `${onHand} em estoque` : 'Sem estoque'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
