"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

interface ProductFiltersProps {
  category: string;
  subCategory?: string;
}

// Filter Data
const womenPriceRanges = ["Under ₹1000", "₹1000–₹3000", "Above ₹3000"];
const womenStyles = ["Casual", "Formal", "Luxury", "Fashion", "Party", "Office"];
const womenStrapTypes = ["Metal", "Leather", "Ceramic", "Mesh"];
const womenColors = ["Rose Gold", "Gold", "Silver", "Black", "Pink"];

const watchStyles = ['Formal', 'Casual', 'Sports', 'Luxury', 'Fashion'];
const watchStrapTypes = ['Leather', 'Stainless Steel', 'Silicone', 'Mesh', 'Fabric'];

const shirtFits = ["Slim Fit", "Regular Fit", "Oversized"];
const shirtTypes = ["Casual", "Formal", "Printed"];
const shirtSleeves = ["Full Sleeve", "Half Sleeve"];
const shirtColors = ["Black", "White", "Blue", "Checked"];

const pantTypes = ["Formal", "Casual", "Jeans", "Chinos"];
const pantFits = ["Slim", "Regular"];
const pantColors = ["Black", "Grey", "Blue", "Brown"];


export function ProductFilters({ category, subCategory }: ProductFiltersProps) {
  const [priceRange, setPriceRange] = useState([0, 10000]);

  const renderWomenFilters = () => (
    <>
      <div className="space-y-4">
        <Label className="font-semibold">Price Range</Label>
        <RadioGroup defaultValue="any">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="any" id="price-any" />
            <Label htmlFor="price-any" className="font-normal">Any Price</Label>
          </div>
          {womenPriceRanges.map((range) => (
            <div key={range} className="flex items-center space-x-2">
              <RadioGroupItem value={range} id={`price-${range}`} />
              <Label htmlFor={`price-${range}`} className="font-normal">{range}</Label>
            </div>
          ))}
        </RadioGroup>
      </div>
      <div className="space-y-3">
        <Label className="font-semibold">Color</Label>
        <div className="space-y-2">
          {womenColors.map((color) => (
            <div key={color} className="flex items-center space-x-2">
              <Checkbox id={`color-${color.toLowerCase().replace(' ', '-')}`} />
              <Label htmlFor={`color-${color.toLowerCase().replace(' ', '-')}`} className="font-normal">{color}</Label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Label className="font-semibold">Style</Label>
        <div className="space-y-2">
          {womenStyles.map((style) => (
            <div key={style} className="flex items-center space-x-2">
              <Checkbox id={`style-${style.toLowerCase()}`} />
              <Label htmlFor={`style-${style.toLowerCase()}`} className="font-normal">{style}</Label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Label className="font-semibold">Strap</Label>
        <div className="space-y-2">
          {womenStrapTypes.map((strap) => (
            <div key={strap} className="flex items-center space-x-2">
              <Checkbox id={`strap-${strap.toLowerCase().replace(' ', '-')}`} />
              <Label htmlFor={`strap-${strap.toLowerCase().replace(' ', '-')}`} className="font-normal">{strap}</Label>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderMenWatchFilters = () => (
    <>
      <div className="space-y-3">
          <Label className="font-semibold">Style</Label>
          <div className="space-y-2">
            {watchStyles.map((style) => (
              <div key={style} className="flex items-center space-x-2">
                <Checkbox id={`style-${style.toLowerCase()}`} />
                <Label htmlFor={`style-${style.toLowerCase()}`} className="font-normal">{style}</Label>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <Label className="font-semibold">Strap</Label>
          <div className="space-y-2">
            {watchStrapTypes.map((strap) => (
              <div key={strap} className="flex items-center space-x-2">
                <Checkbox id={`strap-${strap.toLowerCase().replace(' ', '-')}`} />
                <Label htmlFor={`strap-${strap.toLowerCase().replace(' ', '-')}`} className="font-normal">{strap}</Label>
              </div>
            ))}
          </div>
        </div>
    </>
  );

  const renderMenShirtFilters = () => (
    <>
      <div className="space-y-3">
        <Label className="font-semibold">Fit</Label>
        <div className="space-y-2">
          {shirtFits.map((fit) => (
            <div key={fit} className="flex items-center space-x-2">
              <Checkbox id={`fit-${fit.toLowerCase().replace(' ', '-')}`} />
              <Label htmlFor={`fit-${fit.toLowerCase().replace(' ', '-')}`} className="font-normal">{fit}</Label>
            </div>
          ))}
        </div>
      </div>
       <div className="space-y-3">
        <Label className="font-semibold">Type</Label>
        <div className="space-y-2">
          {shirtTypes.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox id={`type-${type.toLowerCase()}`} />
              <Label htmlFor={`type-${type.toLowerCase()}`} className="font-normal">{type}</Label>
            </div>
          ))}
        </div>
      </div>
       <div className="space-y-3">
        <Label className="font-semibold">Sleeve</Label>
        <div className="space-y-2">
          {shirtSleeves.map((sleeve) => (
            <div key={sleeve} className="flex items-center space-x-2">
              <Checkbox id={`sleeve-${sleeve.toLowerCase().replace(' ', '-')}`} />
              <Label htmlFor={`sleeve-${sleeve.toLowerCase().replace(' ', '-')}`} className="font-normal">{sleeve}</Label>
            </div>
          ))}
        </div>
      </div>
       <div className="space-y-3">
        <Label className="font-semibold">Color</Label>
        <div className="space-y-2">
          {shirtColors.map((color) => (
            <div key={color} className="flex items-center space-x-2">
              <Checkbox id={`color-${color.toLowerCase()}`} />
              <Label htmlFor={`color-${color.toLowerCase()}`} className="font-normal">{color}</Label>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  const renderMenPantFilters = () => (
    <>
       <div className="space-y-3">
        <Label className="font-semibold">Type</Label>
        <div className="space-y-2">
          {pantTypes.map((type) => (
            <div key={type} className="flex items-center space-x-2">
              <Checkbox id={`pant-type-${type.toLowerCase()}`} />
              <Label htmlFor={`pant-type-${type.toLowerCase()}`} className="font-normal">{type}</Label>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <Label className="font-semibold">Fit</Label>
        <div className="space-y-2">
          {pantFits.map((fit) => (
            <div key={fit} className="flex items-center space-x-2">
              <Checkbox id={`pant-fit-${fit.toLowerCase().replace(' ', '-')}`} />
              <Label htmlFor={`pant-fit-${fit.toLowerCase().replace(' ', '-')}`} className="font-normal">{fit}</Label>
            </div>
          ))}
        </div>
      </div>
       <div className="space-y-3">
        <Label className="font-semibold">Color</Label>
        <div className="space-y-2">
          {pantColors.map((color) => (
            <div key={color} className="flex items-center space-x-2">
              <Checkbox id={`pant-color-${color.toLowerCase()}`} />
              <Label htmlFor={`pant-color-${color.toLowerCase()}`} className="font-normal">{color}</Label>
            </div>
          ))}
        </div>
      </div>
    </>
  );


  const renderMenFilters = () => {
    switch (subCategory) {
      case 'shirt': return renderMenShirtFilters();
      case 'pant': return renderMenPantFilters();
      case 'watch':
      default: return renderMenWatchFilters();
    }
  };
  
  const renderCommonFilters = () => (
     <>
        <div className="space-y-4">
          <Label className="font-semibold">Price Range</Label>
          <Slider
            min={0}
            max={10000}
            step={500}
            value={priceRange}
            onValueChange={setPriceRange}
          />
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>₹{priceRange[0]}</span>
            <span>₹{priceRange[1]}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Label className="font-semibold">Availability</Label>
           <div className="flex items-center space-x-2">
              <Checkbox id="availability-stock" />
              <Label htmlFor="availability-stock" className="font-normal">
                In Stock Only
              </Label>
            </div>
        </div>
      </>
  )

  return (
    <Card className="bg-background border-none shadow-none">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          Filters
          <Button variant="ghost" size="sm">
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {category === 'women' && renderWomenFilters()}
        {category !== 'women' && renderCommonFilters()}
        {category === 'men' && renderMenFilters()}
        {category !== 'men' && category !== 'women' && renderMenWatchFilters()}
      </CardContent>
    </Card>
  );
}
