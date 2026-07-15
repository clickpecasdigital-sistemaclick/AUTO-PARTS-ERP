# Alterações de schema — Sprint 05 (Módulo Comercial de Produtos)

Aditivas, sem remoção de nenhum campo/tabela existente:

- **`ProductCategory`** (nova tabela) — classificação adicional independente de Grupo/Subgrupo.
- **`Product`**: `categoryId`, `defaultCfopCode`, `defaultCstCode`, `defaultCsosnCode`, `distributorPrice`.
- **`ProductCrossReference`**: campo `type` (`ProductRelationType`: similar/equivalent/complementary/substitute) + `notes`, substituindo a constraint única `[productId, relatedProductId]` por `[productId, relatedProductId, type]` (permite, por ex., o mesmo par de produtos ser ao mesmo tempo "similar" e "complementar" — ou normalmente apenas um tipo).
- **`ProductPromotion`** (nova tabela) — estrutura de promoções futuras, sem regra de aplicação implementada (consumo fica para o módulo de Vendas/PDV).

Migration a ser gerada via `prisma migrate dev --name sprint05_products_commercial` em ambiente com acesso ao banco.
