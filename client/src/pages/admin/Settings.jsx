import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  FiSave, FiUploadCloud, FiShoppingBag, FiPhone, FiShare2, FiTruck, FiBell, FiSearch,
} from 'react-icons/fi';
import AdminPageHeader from '../../components/admin/AdminPageHeader.jsx';
import Input, { Textarea, Select } from '../../components/ui/Input.jsx';
import Button from '../../components/ui/Button.jsx';
import Tabs from '../../components/ui/Tabs.jsx';
import SmartImage from '../../components/ui/SmartImage.jsx';
import Spinner from '../../components/ui/Spinner.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { adminSettingsService } from '../../services/adminService.js';

const TABS = [
  { value: 'store', label: 'Store' },
  { value: 'contact', label: 'Contact' },
  { value: 'social', label: 'Social' },
  { value: 'commerce', label: 'Commerce' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'seo', label: 'SEO' },
];

const Field = ({ children }) => <div className="grid gap-5 sm:grid-cols-2">{children}</div>;

const Settings = () => {
  const logoRef = useRef(null);

  const [settings, setSettings] = useState(null);
  const [tab, setTab] = useState('store');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const load = () => {
    adminSettingsService
      .get()
      .then((response) => setSettings(response.data.settings))
      .catch((error) => toast.error(error.message))
      .finally(() => setIsLoading(false));
  };

  useEffect(load, []);

  const setField = (section, field, value) => {
    setSettings((current) => ({ ...current, [section]: { ...current[section], [field]: value } }));
  };

  const save = async () => {
    setIsSaving(true);
    try {
      // Send only the editable sections; the server merges them field by field.
      const { store, contact, social, commerce, delivery, announcement, seo } = settings;
      const response = await adminSettingsService.update({
        store: { name: store.name, tagline: store.tagline, description: store.description },
        contact,
        social,
        commerce,
        delivery,
        announcement,
        seo,
      });
      setSettings(response.data.settings);
      toast.success(response.message || 'Settings saved.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadLogo = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Please choose an image under 5 MB.');
      event.target.value = '';
      return;
    }

    setIsUploading(true);
    try {
      const response = await adminSettingsService.uploadBranding('logo', file);
      setSettings(response.data.settings);
      toast.success('Logo updated.');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 rounded-card" />
      </div>
    );
  }

  return (
    <div>
      <AdminPageHeader title="Website settings" description="Everything here is used by the live storefront.">
        <Button size="sm" icon={FiSave} onClick={save} isLoading={isSaving} loadingText="Saving...">
          Save settings
        </Button>
      </AdminPageHeader>

      <Tabs tabs={TABS} active={tab} onChange={setTab} className="mb-6" />

      <div className="card p-6 sm:p-8">
        {tab === 'store' && (
          <div className="space-y-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
              <FiShoppingBag className="text-caramel-600" /> Store identity
            </h2>

            <div className="flex flex-wrap items-center gap-5">
              <div className="h-20 w-20 overflow-hidden rounded-2xl border border-cream-300 bg-cream-200">
                {settings.store.logo?.url ? (
                  <SmartImage src={settings.store.logo.url} alt="Store logo" width={200} className="h-full w-full" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-display text-2xl text-cocoa-300">
                    SL
                  </span>
                )}
              </div>

              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  icon={isUploading ? undefined : FiUploadCloud}
                  isLoading={isUploading}
                  onClick={() => logoRef.current?.click()}
                >
                  Upload logo
                </Button>
                <p className="mt-1.5 text-xs text-cocoa-300">PNG or SVG on a transparent background works best.</p>
              </div>
              <input ref={logoRef} type="file" accept="image/*" onChange={uploadLogo} className="hidden" />
            </div>

            <Field>
              <Input
                label="Store name"
                value={settings.store.name}
                onChange={(event) => setField('store', 'name', event.target.value)}
              />
              <Input
                label="Tagline"
                value={settings.store.tagline}
                onChange={(event) => setField('store', 'tagline', event.target.value)}
              />
            </Field>

            <Textarea
              label="Store description"
              value={settings.store.description}
              onChange={(event) => setField('store', 'description', event.target.value)}
              rows={4}
              hint="Shown in the footer and used as the default meta description."
            />
          </div>
        )}

        {tab === 'contact' && (
          <div className="space-y-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
              <FiPhone className="text-caramel-600" /> Contact details
            </h2>

            <Field>
              <Input
                label="Phone"
                value={settings.contact.phone}
                onChange={(event) => setField('contact', 'phone', event.target.value)}
              />
              <Input
                label="WhatsApp"
                value={settings.contact.whatsapp}
                onChange={(event) => setField('contact', 'whatsapp', event.target.value)}
              />
              <Input
                label="Email"
                type="email"
                value={settings.contact.email}
                onChange={(event) => setField('contact', 'email', event.target.value)}
              />
              <Input
                label="Working hours"
                value={settings.contact.workingHours}
                onChange={(event) => setField('contact', 'workingHours', event.target.value)}
              />
            </Field>

            <Input
              label="Address"
              value={settings.contact.address}
              onChange={(event) => setField('contact', 'address', event.target.value)}
            />
            <Input
              label="Google Maps link"
              value={settings.contact.mapUrl}
              onChange={(event) => setField('contact', 'mapUrl', event.target.value)}
            />
          </div>
        )}

        {tab === 'social' && (
          <div className="space-y-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
              <FiShare2 className="text-caramel-600" /> Social profiles
            </h2>
            <p className="text-sm text-cocoa-400">Leave a field empty to hide that icon in the footer.</p>

            <Field>
              {['instagram', 'facebook', 'tiktok', 'youtube', 'x'].map((platform) => (
                <Input
                  key={platform}
                  label={platform === 'x' ? 'X (Twitter)' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                  value={settings.social[platform] || ''}
                  onChange={(event) => setField('social', platform, event.target.value)}
                  placeholder={`https://${platform === 'x' ? 'x' : platform}.com/sweetlava`}
                />
              ))}
            </Field>
          </div>
        )}

        {tab === 'commerce' && (
          <div className="space-y-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
              <FiShoppingBag className="text-caramel-600" /> Commerce rules
            </h2>
            <p className="text-sm text-cocoa-400">
              These are enforced on the server, so changing them here changes what customers can actually do.
            </p>

            <Field>
              <Input
                label="Currency code"
                value={settings.commerce.currency}
                onChange={(event) => setField('commerce', 'currency', event.target.value)}
                placeholder="EGP"
              />
              <Input
                label="Minimum order amount"
                type="number"
                min="0"
                value={settings.commerce.minimumOrderAmount}
                onChange={(event) => setField('commerce', 'minimumOrderAmount', Number(event.target.value))}
                hint="0 means no minimum."
              />
              <Input
                label="Default low stock threshold"
                type="number"
                min="0"
                value={settings.commerce.lowStockThreshold}
                onChange={(event) => setField('commerce', 'lowStockThreshold', Number(event.target.value))}
              />
              <Input
                label="Tax rate (%)"
                type="number"
                min="0"
                max="100"
                value={settings.commerce.taxRate}
                onChange={(event) => setField('commerce', 'taxRate', Number(event.target.value))}
                disabled={!settings.commerce.taxEnabled}
              />
            </Field>

            <div className="space-y-3 border-t border-cream-300 pt-5">
              {[
                { field: 'allowCashOnDelivery', label: 'Offer cash on delivery', hint: 'Shown as a payment option at checkout.' },
                { field: 'taxEnabled', label: 'Apply tax', hint: 'Adds tax to the order total.' },
                { field: 'taxIncludedInPrice', label: 'Prices already include tax', hint: 'When on, no tax line is added.' },
              ].map((toggle) => (
                <label key={toggle.field} className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.commerce[toggle.field])}
                    onChange={(event) => setField('commerce', toggle.field, event.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-cocoa-300 accent-caramel-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-cocoa-700">{toggle.label}</span>
                    <span className="block text-xs text-cocoa-300">{toggle.hint}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {tab === 'delivery' && (
          <div className="space-y-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
              <FiTruck className="text-caramel-600" /> Delivery messaging
            </h2>
            <p className="text-sm text-cocoa-400">
              Fees and areas live under Delivery zones. This is the copy customers read.
            </p>

            <Textarea
              label="Delivery information"
              value={settings.delivery.info}
              onChange={(event) => setField('delivery', 'info', event.target.value)}
              rows={3}
              hint="Shown on product pages."
            />
            <Textarea
              label="Preparation note"
              value={settings.delivery.preparationNote}
              onChange={(event) => setField('delivery', 'preparationNote', event.target.value)}
              rows={2}
              hint="For items that need notice, such as custom cakes."
            />
          </div>
        )}

        {tab === 'announcement' && (
          <div className="space-y-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
              <FiBell className="text-caramel-600" /> Announcement bar
            </h2>
            <p className="text-sm text-cocoa-400">The strip above the navigation on every storefront page.</p>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-cocoa-600">
              <input
                type="checkbox"
                checked={settings.announcement.enabled}
                onChange={(event) => setField('announcement', 'enabled', event.target.checked)}
                className="h-4 w-4 rounded border-cocoa-300 accent-caramel-500"
              />
              Show the announcement bar
            </label>

            <Input
              label="Message"
              value={settings.announcement.text}
              onChange={(event) => setField('announcement', 'text', event.target.value)}
              maxLength={240}
            />
            <Input
              label="Link"
              value={settings.announcement.link}
              onChange={(event) => setField('announcement', 'link', event.target.value)}
              placeholder="/products"
            />

            {settings.announcement.enabled && settings.announcement.text && (
              <div className="rounded-xl bg-cocoa-800 px-5 py-3 text-center text-sm text-cream-100">
                {settings.announcement.text}
              </div>
            )}
          </div>
        )}

        {tab === 'seo' && (
          <div className="space-y-5">
            <h2 className="flex items-center gap-2 font-display text-lg text-cocoa-800">
              <FiSearch className="text-caramel-600" /> Search engine listing
            </h2>

            <Input
              label="Meta title"
              value={settings.seo.metaTitle}
              onChange={(event) => setField('seo', 'metaTitle', event.target.value)}
              maxLength={70}
              hint={`${settings.seo.metaTitle?.length || 0}/70 characters. Keep it under 60 for best results.`}
            />
            <Textarea
              label="Meta description"
              value={settings.seo.metaDescription}
              onChange={(event) => setField('seo', 'metaDescription', event.target.value)}
              rows={3}
              maxLength={200}
              hint={`${settings.seo.metaDescription?.length || 0}/200 characters. Aim for 150 to 160.`}
            />
            <Input
              label="Keywords"
              value={settings.seo.keywords}
              onChange={(event) => setField('seo', 'keywords', event.target.value)}
              hint="Comma separated."
            />

            <div className="rounded-xl border border-cream-300 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-cocoa-300">Search preview</p>
              <p className="text-lg text-sky-800">{settings.seo.metaTitle || settings.store.name}</p>
              <p className="text-xs text-emerald-700">sweetlava.com</p>
              <p className="mt-1 text-sm text-cocoa-500">{settings.seo.metaDescription}</p>
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end border-t border-cream-300 pt-6">
          <Button icon={FiSave} onClick={save} isLoading={isSaving} loadingText="Saving...">
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
