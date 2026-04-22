'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { categories, menSubCategories, womenSubCategories, kidsSubCategories } from '@/lib/data';
import { ChevronLeft, Sparkles } from 'lucide-react';
import { generateProductDescription } from '@/ai/flows/admin-product-description-generator';
import type { Product } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useProducts } from '@/context/product-context';
import { ImageSelector } from '@/components/image-selector';
import type { SubCategory } from '@/lib/types';

const productSchema = z.object({
  productName: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  priceInr: z.coerce.number().min(0, 'Price must be a positive number'),
  category: z.enum(['Men', 'Women', 'Kids']),
  productType: z.string().min(1, 'Please select a product type'),
  tags: z.string(),
  stockStatus: z.enum(['Available', 'Out of Stock']),
  images: z.array(z.string()).min(1, 'Please select at least one image'),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const { getProductById, updateProduct, loading: productsLoading } = useProducts();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [product, setProduct] = useState<Product | undefined>(undefined);
  
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  const category = form.watch('category');
  const [productTypes, setProductTypes] = useState<SubCategory[]>([]);

  useEffect(() => {
    let newProductTypes: SubCategory[] = [];
    if (category === 'Men') {
      newProductTypes = menSubCategories;
    } else if (category === 'Women') {
      newProductTypes = womenSubCategories;
    } else if (category === 'Kids') {
      newProductTypes = kidsSubCategories;
    }
    setProductTypes(newProductTypes);
    
    // Only reset productType if the current one is not in the new list of types
    const currentProductType = form.getValues('productType');
    if (newProductTypes.length > 0 && !newProductTypes.some(pt => pt.slug === currentProductType)) {
        form.setValue('productType', newProductTypes[0].slug);
    }
  }, [category, form]);

  const hasReset = useRef(false);

  useEffect(() => {
    if (id && !productsLoading && !hasReset.current) {
      const productToEdit = getProductById(id);
      if (productToEdit) {
        hasReset.current = true;
        setProduct(productToEdit);
        form.reset({
          productName: productToEdit.name,
          description: productToEdit.description,
          priceInr: productToEdit.price,
          category: productToEdit.category,
          productType: productToEdit.productType,
          tags: productToEdit.tags.join(', '),
          stockStatus: productToEdit.stockStatus,
          images: productToEdit.images,
        });
      }
    }
  }, [id, productsLoading, getProductById, form]);

  // Handle case where product is not found after loading
  useEffect(() => {
    if (!productsLoading && id && !getProductById(id) && !hasReset.current) {
        toast({
          variant: 'destructive',
          title: 'Product not found',
          description: 'Could not find a product with that ID.',
        });
        router.push('/admin/products');
    }
  }, [productsLoading, id, getProductById, router, toast]);

  const onSubmit = async (data: ProductFormValues) => {
    setIsSaving(true);
    const updatedData: Partial<Product> = {
        name: data.productName,
        description: data.description,
        price: data.priceInr,
        category: data.category,
        productType: data.productType,
        tags: data.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        stockStatus: data.stockStatus,
        images: data.images,
    };

    await updateProduct(id, updatedData);
    
    toast({
      title: 'Product Updated',
      description: `${data.productName} has been successfully updated.`,
    });
    router.push('/admin/products');
    setIsSaving(false);
  };
  
  const handleGenerateDescription = async () => {
    const values = form.getValues();
    if (!values.productName || !values.priceInr) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please enter a Product Name and Price before generating a description.',
        });
        return;
    }

    setIsGenerating(true);
    try {
        const result = await generateProductDescription({
            ...values,
            tags: values.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        });
        form.setValue('description', result.description);
        toast({
            title: 'Description Generated!',
            description: 'The AI has crafted a new product description.',
        });
    } catch (error) {
        console.error('Failed to generate description:', error);
        toast({
            variant: 'destructive',
            title: 'Generation Failed',
            description: 'Could not generate a description at this time.',
        });
    } finally {
        setIsGenerating(false);
    }
  };

  if (product === undefined) {
    return (
      <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-7 w-7" />
          <Skeleton className="h-7 w-48" />
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8 mt-4">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
            <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
          </div>
          <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
            <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-24 w-full" /></CardContent></Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[59rem] flex-1 auto-rows-max gap-4">
       <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex items-center gap-4">
             <Button variant="outline" size="icon" className="h-7 w-7" asChild>
                <Link href="/admin/products">
                    <ChevronLeft className="h-4 w-4" />
                    <span className="sr-only">Back</span>
                </Link>
             </Button>
             <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                Edit: {product.name}
             </h1>
             <div className="hidden items-center gap-2 md:ml-auto md:flex">
                <Button variant="outline" size="sm" type="button" onClick={() => router.push('/admin/products')}>
                    Cancel
                </Button>
                <Button size="sm" type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
             </div>
          </div>
          <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8 mt-4">
            <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                  <CardDescription>
                    Modify the details for this product.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name</Label>
                    <Input id="productName" {...form.register('productName')} />
                    {form.formState.errors.productName && <p className="text-sm text-destructive">{form.formState.errors.productName.message}</p>}
                  </div>
                   <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="description">Description</Label>
                        <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                            <Sparkles className="mr-2 h-4 w-4" />
                            {isGenerating ? 'Generating...' : 'Generate with AI'}
                        </Button>
                    </div>
                    <Textarea id="description" {...form.register('description')} rows={5}/>
                     {form.formState.errors.description && <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent>
                  <Controller
                    control={form.control}
                    name="images"
                    render={({ field }) => (
                      <ImageSelector
                        selectedImages={field.value ?? []}
                        onSelectionChange={field.onChange}
                      />
                    )}
                  />
                  {form.formState.errors.images && <p className="text-sm text-destructive mt-2">{form.formState.errors.images.message}</p>}
                </CardContent>
              </Card>
            </div>
            <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
               <Card>
                <CardHeader>
                  <CardTitle>Product Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-3">
                      <Label htmlFor="stockStatus">Status</Label>
                      <Controller
                        control={form.control}
                        name="stockStatus"
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger id="stockStatus" aria-label="Select status">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Available">Available</SelectItem>
                                    <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Product Organization</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Product Category</Label>
                    <Controller
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <SelectTrigger id="category" aria-label="Select category">
                                    <SelectValue placeholder="Select category" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map(c => <SelectItem key={c.slug} value={c.name}>{c.name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        )}
                      />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="productType">Product Type</Label>
                    <Controller
                        control={form.control}
                        name="productType"
                        render={({ field }) => (
                             <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger id="productType" aria-label="Select product type">
                                    <SelectValue placeholder="Select product type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {productTypes.map(pt => (
                                      <SelectItem key={pt.slug} value={pt.slug}>{pt.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                      />
                      {form.formState.errors.productType && <p className="text-sm text-destructive">{form.formState.errors.productType.message}</p>}
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="priceInr">Price (INR)</Label>
                    <Input id="priceInr" type="number" {...form.register('priceInr')} />
                     {form.formState.errors.priceInr && <p className="text-sm text-destructive">{form.formState.errors.priceInr.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags (comma-separated)</Label>
                    <Input id="tags" {...form.register('tags')} placeholder="e.g. Formal, Leather" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 md:hidden mt-4">
            <Button variant="outline" size="sm" type="button" onClick={() => router.push('/admin/products')}>
                Cancel
            </Button>
            <Button size="sm" type="submit" disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
    </div>
  );
}
