
-- GENESIS MY SHOP
-- MIGRATION 003
-- Products catalogue

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    shop_id UUID NOT NULL
        REFERENCES public.shops(id) ON DELETE CASCADE,

    name TEXT NOT NULL
        CHECK (length(trim(name)) BETWEEN 1 AND 120),

    product_code TEXT,

    unit TEXT NOT NULL DEFAULT 'piece'
        CHECK (length(trim(unit)) BETWEEN 1 AND 30),

    cost_price NUMERIC(12,2) NOT NULL DEFAULT 0
        CHECK (cost_price >= 0),

    selling_price NUMERIC(12,2) NOT NULL
        CHECK (selling_price >= 0),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (shop_id, product_code)
);


-- Indexes for faster shop-specific product searches.

CREATE INDEX idx_products_shop_id
ON public.products(shop_id);

CREATE INDEX idx_products_shop_active
ON public.products(shop_id, is_active);


-- Enable Row Level Security.

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;


-- Active shop members can view products.

CREATE POLICY "Shop members can view products"
ON public.products
FOR SELECT
TO authenticated
USING (
    public.is_shop_member(shop_id)
);


-- Active shop members can add products.

CREATE POLICY "Shop members can add products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_shop_member(shop_id)
);


-- Active shop members can update products.

CREATE POLICY "Shop members can update products"
ON public.products
FOR UPDATE
TO authenticated
USING (
    public.is_shop_member(shop_id)
)
WITH CHECK (
    public.is_shop_member(shop_id)
);


-- Active shop members can delete products.

CREATE POLICY "Shop members can delete products"
ON public.products
FOR DELETE
TO authenticated
USING (
    public.is_shop_member(shop_id)
);


-- Allow authenticated users to perform these operations.
GRANT SELECT, INSERT, UPDATE, DELETE
ON public.products TO authenticated;
