// HYDRATION FIX: Disable static generation to prevent prerendering issues with Firebase
export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { businessDetails } from "@/lib/data";
import { Phone, Mail, MapPin } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="container py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight">Get In Touch</h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          We'd love to hear from you. Whether you have a question about our products, need assistance, or just want to talk watches, we're here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div className="space-y-6">
          <form className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" placeholder="Your Name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Your Email" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input id="subject" placeholder="Subject" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Your Message" rows={5} />
            </div>
            <Button type="submit" className="w-full" size="lg">Send Message</Button>
          </form>
        </div>

        {/* Contact Info */}
        <div className="space-y-8">
            <h2 className="text-2xl font-bold">Contact Information</h2>
            <div className="space-y-6">
                 <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground rounded-full p-3">
                         <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Our Address</h3>
                        <p className="text-muted-foreground">{businessDetails.address}</p>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground rounded-full p-3">
                         <Mail className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Email Us</h3>
                        <a href={`mailto:${businessDetails.email}`} className="text-muted-foreground hover:text-primary transition-colors">{businessDetails.email}</a>
                    </div>
                </div>
                 <div className="flex items-start gap-4">
                    <div className="bg-primary text-primary-foreground rounded-full p-3">
                         <Phone className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold">Call Us</h3>
                         <a href={`tel:${businessDetails.phone}`} className="text-muted-foreground hover:text-primary transition-colors">{businessDetails.phone}</a>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
