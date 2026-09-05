import Seo from '../components/ui/Seo.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useSettings } from '../context/SettingsContext.jsx';

/** Shared shell for the terms and privacy pages so they stay visually identical. */
const LegalPage = ({ title, description, updated, sections }) => {
  const { settings, storeName } = useSettings();

  return (
    <>
      <Seo title={title} description={description} />

      <div className="bg-warm-gradient">
        <div className="container-page py-12 md:py-16">
          <PageHeader title={title} description={description} breadcrumbs={[{ label: title }]} />
        </div>
      </div>

      <div className="container-page section">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <nav aria-label="On this page" className="hidden lg:block">
            <div className="sticky top-24">
              <p className="eyebrow mb-3">On this page</p>
              <ul className="space-y-1.5">
                {sections.map((section, index) => (
                  <li key={section.heading}>
                    <a
                      href={`#section-${index}`}
                      className="block rounded-lg px-3 py-2 text-sm text-cocoa-400 transition-colors hover:bg-cream-200 hover:text-cocoa-800"
                    >
                      {section.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <article className="card p-6 sm:p-10">
            <p className="text-xs uppercase tracking-widest text-cocoa-300">Last updated {updated}</p>

            <div className="mt-8 space-y-10">
              {sections.map((section, index) => (
                <section key={section.heading} id={`section-${index}`} className="scroll-mt-24">
                  <h2 className="font-display text-xl text-cocoa-800">
                    {index + 1}. {section.heading}
                  </h2>
                  <div className="mt-3 space-y-3 text-sm leading-relaxed text-cocoa-400">
                    {section.body.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                    {section.list && (
                      <ul className="mt-2 space-y-2">
                        {section.list.map((item) => (
                          <li key={item} className="flex gap-2.5">
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-caramel-400" aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <footer className="mt-12 rounded-2xl bg-cream-200/70 p-6">
              <p className="text-sm text-cocoa-500">
                Questions about this document? Email us at{' '}
                <a href={`mailto:${settings.contact?.email}`} className="font-semibold text-caramel-700 hover:underline">
                  {settings.contact?.email}
                </a>{' '}
                and we will get back to you. {storeName} is registered and operating in Cairo, Egypt.
              </p>
            </footer>
          </article>
        </div>
      </div>
    </>
  );
};

export default LegalPage;
