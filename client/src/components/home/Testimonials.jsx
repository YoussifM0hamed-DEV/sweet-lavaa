import { FiStar } from 'react-icons/fi';
import SectionHeading from '../ui/SectionHeading.jsx';
import useReveal from '../../hooks/useReveal.js';
import { initials } from '../../utils/format.js';

const TESTIMONIALS = [
  {
    name: 'Nour Hassan',
    location: 'New Cairo',
    rating: 5,
    quote:
      'I ordered the lava cake for my mother birthday and it arrived still warm. She has asked for it three times since. The packaging alone made the evening feel like an occasion.',
  },
  {
    name: 'Karim Sobhy',
    location: 'Heliopolis',
    rating: 5,
    quote:
      'I have tried most bakeries in Cairo. Sweet Lava is the only one where the cookies are the same on the fifth order as they were on the first. That consistency is rare.',
  },
  {
    name: 'Mariam Adel',
    location: 'Madinaty',
    rating: 5,
    quote:
      'We used the corporate boxes for our whole team at year end. Thirty-two boxes, delivered on time, every single one perfect. Two clients asked where they came from.',
  },
];

const Testimonials = () => {
  const ref = useReveal();

  return (
    <section className="section">
      <div className="container-page">
        <SectionHeading
          eyebrow="From our customers"
          title="What people say after the first bite"
          align="center"
        />

        <div ref={ref} className="reveal grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <figure key={testimonial.name} className="card flex h-full flex-col p-7">
              <div className="flex gap-0.5 text-gold-400" aria-label={`${testimonial.rating} out of 5 stars`}>
                {Array.from({ length: testimonial.rating }).map((_, index) => (
                  <FiStar key={index} fill="currentColor" className="text-sm" />
                ))}
              </div>

              <blockquote className="mt-4 flex-1">
                <p className="font-display text-[1.05rem] leading-relaxed text-cocoa-700">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3 border-t border-cream-300 pt-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-caramel-100 font-display text-sm font-semibold text-caramel-700">
                  {initials(testimonial.name)}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-cocoa-800">{testimonial.name}</span>
                  <span className="block text-xs text-cocoa-300">{testimonial.location}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
