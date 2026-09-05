import { FiHeart, FiAward, FiUsers, FiClock } from 'react-icons/fi';
import Seo from '../components/ui/Seo.jsx';
import SmartImage from '../components/ui/SmartImage.jsx';
import Button from '../components/ui/Button.jsx';
import SectionHeading from '../components/ui/SectionHeading.jsx';
import useReveal from '../hooks/useReveal.js';
import { IMAGE_URLS } from '../utils/heroImages.js';
import { useSettings } from '../context/SettingsContext.jsx';

const STATS = [
  { icon: FiClock, value: '2019', label: 'Baking since' },
  { icon: FiUsers, value: '12,000+', label: 'Orders delivered' },
  { icon: FiAward, value: '30+', label: 'Recipes on the menu' },
  { icon: FiHeart, value: '4.9', label: 'Average rating' },
];

const VALUES = [
  {
    title: 'We bake to order, not to stock',
    body: 'Nothing sits in a display case for two days. Every order is baked the morning it goes out, which is why we sell out and why we are fine with that.',
  },
  {
    title: 'Real ingredients, named on the page',
    body: 'Belgian chocolate, Madagascar vanilla, Sicilian pistachios, real butter. If we would not say it out loud, it does not go in the bowl.',
  },
  {
    title: 'Small batches, on purpose',
    body: 'We could scale up and lose the plot. Instead we keep the batches small enough that one person can taste everything before it leaves.',
  },
];

const About = () => {
  const { settings } = useSettings();
  const storyRef = useReveal();
  const valuesRef = useReveal();

  return (
    <>
      <Seo
        title="About us"
        description="Sweet Lava is a small Cairo bakery making cakes, cookies and desserts in small batches with ingredients worth naming."
      />

      <section className="relative overflow-hidden bg-warm-gradient">
        <div className="container-page py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow">Our story</p>
            <h1 className="mt-4 text-display-lg text-balance">
              A small kitchen with a stubborn rule
            </h1>
            <p className="lede mx-auto mt-6 max-w-2xl">
              Nothing leaves this kitchen unless we would happily serve it at our own table. That single rule has
              shaped every recipe, every supplier and every hire since 2019.
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <div ref={storyRef} className="reveal grid items-center gap-12 lg:grid-cols-2">
            <div className="relative">
              <div className="aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift">
                <SmartImage src={IMAGE_URLS.aboutStory} alt="Inside the Sweet Lava kitchen" width={900} className="h-full w-full" />
              </div>
              <div className="absolute -bottom-6 -right-4 hidden w-56 rounded-2xl bg-cocoa-800 p-5 text-cream-100 shadow-lift sm:block">
                <p className="font-display text-3xl">4 AM</p>
                <p className="mt-1 text-xs text-cream-300/70">when the first oven goes on, every day of the week</p>
              </div>
            </div>

            <div>
              <p className="eyebrow">How it started</p>
              <h2 className="mt-3 text-display-sm text-balance">One cake, one birthday, one very persistent friend</h2>

              <div className="mt-6 space-y-4 text-base leading-relaxed text-cocoa-400">
                <p>
                  Sweet Lava started in a home kitchen in New Cairo with a molten chocolate cake made for a friend
                  birthday. She asked for another one the following week. Then her sister did. Then her office did.
                </p>
                <p>
                  Within a year we had outgrown the kitchen, and by 2021 we had a proper bakery, a pastry chef who
                  argues with us about butter temperature, and a delivery route that covers most of Cairo.
                </p>
                <p>
                  What has not changed is the way things are made. The lava cake recipe on the menu today is the same
                  one from that first birthday, and it still gets pulled from the oven by eye rather than by timer.
                </p>
              </div>

              <Button to="/products" className="mt-8">
                Taste what we mean
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-cocoa-gradient py-16 md:py-20">
        <div className="container-page">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-caramel-500/20 text-xl text-caramel-300">
                    <stat.icon />
                  </span>
                  <span className="mt-4 block font-display text-3xl font-semibold text-cream-50">{stat.value}</span>
                  <span className="mt-1 block text-xs uppercase tracking-widest text-cream-300/50">{stat.label}</span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="section">
        <div className="container-page">
          <SectionHeading eyebrow="What we believe" title="Three things we will not compromise on" align="center" />

          <div ref={valuesRef} className="reveal grid gap-5 lg:grid-cols-3">
            {VALUES.map((value, index) => (
              <article key={value.title} className="card p-7">
                <span className="font-display text-4xl text-caramel-200">0{index + 1}</span>
                <h3 className="mt-3 font-display text-xl leading-snug text-cocoa-800">{value.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-cocoa-400">{value.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight pb-20">
        <div className="container-page">
          <div className="grid items-center gap-10 rounded-[2rem] bg-cream-200/70 p-8 lg:grid-cols-2 lg:p-12">
            <div className="aspect-[16/10] overflow-hidden rounded-2xl">
              <SmartImage src={IMAGE_URLS.aboutKitchen} alt="Pastry being prepared by hand" width={900} className="h-full w-full" />
            </div>

            <div>
              <p className="eyebrow">Visit us</p>
              <h2 className="mt-3 text-display-sm">Come say hello</h2>
              <p className="mt-4 text-base leading-relaxed text-cocoa-400">
                The counter is open daily and there is usually something warm on it. If you are planning an event or a
                large order, come in and we will taste through the options together.
              </p>

              <dl className="mt-6 space-y-2 text-sm">
                {settings.contact?.address && (
                  <div className="flex gap-2">
                    <dt className="font-semibold text-cocoa-700">Address:</dt>
                    <dd className="text-cocoa-400">{settings.contact.address}</dd>
                  </div>
                )}
                {settings.contact?.workingHours && (
                  <div className="flex gap-2">
                    <dt className="font-semibold text-cocoa-700">Hours:</dt>
                    <dd className="text-cocoa-400">{settings.contact.workingHours}</dd>
                  </div>
                )}
                {settings.contact?.phone && (
                  <div className="flex gap-2">
                    <dt className="font-semibold text-cocoa-700">Phone:</dt>
                    <dd className="text-cocoa-400">{settings.contact.phone}</dd>
                  </div>
                )}
              </dl>

              <div className="mt-7 flex flex-wrap gap-3">
                <Button to="/contact">Contact us</Button>
                <Button to="/products" variant="outline">
                  See the menu
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
