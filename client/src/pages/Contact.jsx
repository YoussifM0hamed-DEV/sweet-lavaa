import { useState } from 'react';
import toast from 'react-hot-toast';
import { FiPhone, FiMail, FiMapPin, FiClock, FiSend, FiCheckCircle } from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import Input, { Textarea, Select } from '../components/ui/Input.jsx';
import Button from '../components/ui/Button.jsx';
import SmartImage from '../components/ui/SmartImage.jsx';
import { miscService } from '../services/catalogService.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { IMAGE_URLS } from '../utils/heroImages.js';

const SUBJECTS = [
  { value: 'General enquiry', label: 'General enquiry' },
  { value: 'Order support', label: 'Order support' },
  { value: 'Custom cake', label: 'Custom cake request' },
  { value: 'Corporate gifting', label: 'Corporate gifting' },
  { value: 'Allergen question', label: 'Allergen question' },
  { value: 'Feedback', label: 'Feedback' },
];

const Contact = () => {
  const { settings } = useSettings();

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: 'General enquiry', message: '' });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();

    const found = {};
    if (form.name.trim().length < 2) found.name = 'Please tell us your name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) found.email = 'Please enter a valid email address.';
    if (form.phone && !/^[+0-9][0-9\s-]{6,19}$/.test(form.phone)) found.phone = 'Please enter a valid phone number.';
    if (form.message.trim().length < 10) found.message = 'Please tell us a little more (at least 10 characters).';

    setErrors(found);
    if (Object.keys(found).length) return;

    setIsSubmitting(true);
    try {
      const response = await miscService.contact(form);
      toast.success(response.message);
      setSent(true);
    } catch (error) {
      setErrors(error.toFieldMap?.() || {});
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const details = [
    { icon: FiPhone, label: 'Phone', value: settings.contact?.phone, href: `tel:${settings.contact?.phone}` },
    { icon: FiMail, label: 'Email', value: settings.contact?.email, href: `mailto:${settings.contact?.email}` },
    { icon: FiMapPin, label: 'Address', value: settings.contact?.address },
    { icon: FiClock, label: 'Hours', value: settings.contact?.workingHours },
  ].filter((entry) => entry.value);

  return (
    <>
      <Seo
        title="Contact us"
        description="Questions about an order, a custom cake or corporate gifting? Talk to the Sweet Lava team."
      />

      <div className="bg-warm-gradient">
        <div className="container-page py-12 md:py-16">
          <PageHeader
            title="Get in touch"
            description="Whether it is an order that needs chasing or a cake that needs designing, we usually reply within one business day."
            breadcrumbs={[{ label: 'Contact' }]}
          />
        </div>
      </div>

      <div className="container-page section">
        <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
          <div className="card p-6 sm:p-8">
            {sent ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-3xl text-emerald-600">
                  <FiCheckCircle />
                </span>
                <h2 className="mt-6 font-display text-2xl text-cocoa-800">Message received</h2>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-cocoa-400">
                  Thank you for reaching out. Someone from our team will reply to{' '}
                  <strong className="text-cocoa-700">{form.email}</strong> within one business day.
                </p>
                <Button
                  variant="outline"
                  className="mt-7"
                  onClick={() => {
                    setSent(false);
                    setForm({ name: '', email: '', phone: '', subject: 'General enquiry', message: '' });
                  }}
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <>
                <h2 className="font-display text-2xl text-cocoa-800">Send us a message</h2>
                <p className="mt-1.5 text-sm text-cocoa-400">Fields marked with an asterisk are required.</p>

                <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Your name"
                      value={form.name}
                      onChange={(event) => setField('name', event.target.value)}
                      error={errors.name}
                      placeholder="Nour Hassan"
                      autoComplete="name"
                      required
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={form.email}
                      onChange={(event) => setField('email', event.target.value)}
                      error={errors.email}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Phone"
                      value={form.phone}
                      onChange={(event) => setField('phone', event.target.value)}
                      error={errors.phone}
                      placeholder="01012345678"
                      autoComplete="tel"
                    />
                    <Select
                      label="Subject"
                      value={form.subject}
                      onChange={(event) => setField('subject', event.target.value)}
                      options={SUBJECTS}
                    />
                  </div>

                  <Textarea
                    label="Message"
                    value={form.message}
                    onChange={(event) => setField('message', event.target.value)}
                    error={errors.message}
                    placeholder="Tell us what you need — dates, guest numbers and any allergies all help."
                    rows={6}
                    required
                  />

                  <Button type="submit" size="lg" icon={FiSend} isLoading={isSubmitting} loadingText="Sending…">
                    Send message
                  </Button>
                </form>
              </>
            )}
          </div>

          <aside className="space-y-5">
            <div className="card overflow-hidden">
              <div className="aspect-[16/10]">
                <SmartImage src={IMAGE_URLS.contactShop} alt="The Sweet Lava counter" width={700} className="h-full w-full" />
              </div>
              <div className="p-6">
                <h2 className="font-display text-xl text-cocoa-800">Visit the bakery</h2>
                <dl className="mt-5 space-y-4">
                  {details.map((detail) => (
                    <div key={detail.label} className="flex gap-3">
                      <dt className="mt-0.5 shrink-0 text-caramel-600">
                        <detail.icon />
                        <span className="sr-only">{detail.label}</span>
                      </dt>
                      <dd className="text-sm text-cocoa-500">
                        {detail.href ? (
                          <a href={detail.href} className="transition-colors hover:text-caramel-700">
                            {detail.value}
                          </a>
                        ) : (
                          detail.value
                        )}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>

            <div className="card bg-cocoa-800 p-6 text-cream-100">
              <h2 className="font-display text-lg">Planning something big?</h2>
              <p className="mt-2 text-sm leading-relaxed text-cream-300/70">
                Weddings, corporate gifting and events need a little more lead time. Send us the date and guest count
                and we will come back with options and pricing.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default Contact;
