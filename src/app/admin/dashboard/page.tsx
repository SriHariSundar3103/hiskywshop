'use client';

import { useProducts } from '@/context/product-context';
import { categories } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Package, Shapes, CheckCircle, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemo } from 'react';

export default function AdminDashboardPage() {
  const { products, loading } = useProducts();

  const stats = useMemo(() => {
    const safeProducts = products || [];
    const totalProducts = safeProducts.length;
    const totalCategories = categories.length;
    const inStock = safeProducts.filter(p => p.stockStatus === 'Available').length;
    const outOfStock = totalProducts - inStock;
    const productsByCategory = categories.map(category => ({
      name: category.name,
      count: safeProducts.filter(p => p.category === category.name).length,
    }));

    return { totalProducts, totalCategories, inStock, outOfStock, productsByCategory };
  }, [products]);


  const chartConfig = {
    count: {
      label: "Products",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig;

  const StatCard = ({ title, value, icon, isLoading }: { title: string, value: number, icon: React.ReactNode, isLoading: boolean }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-8 w-16 mt-1" /> : (
          <div className="text-2xl font-bold">{value}</div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Products" value={stats.totalProducts} icon={<Package className="h-4 w-4 text-muted-foreground" />} isLoading={loading} />
        <StatCard title="Total Categories" value={stats.totalCategories} icon={<Shapes className="h-4 w-4 text-muted-foreground" />} isLoading={loading} />
        <StatCard title="In Stock" value={stats.inStock} icon={<CheckCircle className="h-4 w-4 text-muted-foreground" />} isLoading={loading} />
        <StatCard title="Out of Stock" value={stats.outOfStock} icon={<XCircle className="h-4 w-4 text-muted-foreground" />} isLoading={loading} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Products by Category</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[350px] w-full p-4">
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <ChartContainer config={chartConfig} className="h-[350px] w-full">
              <ResponsiveContainer>
                <BarChart data={stats.productsByCategory} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                  />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent />}
                  />
                  <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
