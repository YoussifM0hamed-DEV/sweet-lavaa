import { FiHeart, FiAward, FiTruck, FiShield, FiSun } from 'react-icons/fi';
import SectionHeading from '../ui/SectionHeading.jsx';
import useReveal from '../../hooks/useReveal.js';

const BENEFITS = [
  {
    icon: FiSun,
    title: 'Baked this morning',
    description: 'Nothing is made in advance. Everything you order is baked the day it reaches you.',
  },
  {
    icon: FiAward,
    title: 'Ingredients worth naming',
    description: 'Belgian chocolate, real butter, Madagascar vanilla, Sicilian pistachios. No shortcuts.',
  },
  {
    icon: FiTruck,
    title: 'Same-day Cairo delivery',
    description: 'Order before 4 PM and it arrives today across New Cairo, Nasr City and Heliopolis.',
  },
  {
    icon: FiShield,
    title: 'Secure checkout',
    description: 'Card and wallet payments handled by Paymob. We never see your card details.',
  },
  {
    icon: FiHeart,
    title: 'Made by people who care',
    description: 'A small kitchen, a stubborn team, and a rule that nothing leaves unless we would eat it.',
  },
];

const WhyChooseUs = () => {
  const ref = useReveal();

  return (
    <section className="section bg-cream-200/60">
      <div className="container-page">
        <SectionHeading
          eyebrow="Why Sweet Lava"
          title="The difference is in what we refuse to do"
          align="center"
        />

        <div ref={ref} className="reveal grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {BENEFITS.map((benefit, index) => (
            <article
              key={benefit.title}
              className="card group p-7 transition-all duration-400 ease-smooth hover:-translate-y-1 hover:shadow-lift"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-caramel-100 text-xl text-caramel-600 transition-colors duration-300 group-hover:bg-caramel-500 group-hover:text-white">
                <benefit.icon />
              </span>
              <h3 className="mt-5 font-display text-lg text-cocoa-800">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cocoa-400">{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
