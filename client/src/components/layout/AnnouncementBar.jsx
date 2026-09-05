import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiX } from 'react-icons/fi';
import { useSettings } from '../../context/SettingsContext.jsx';

const AnnouncementBar = () => {
  const { settings } = useSettings();
  const [dismissed, setDismissed] = useState(false);

  if (!settings.announcement?.enabled || !settings.announcement?.text || dismissed) return null;

  return (
    <div className="relative bg-cocoa-800 text-cream-100">
      <div className="container-page flex items-center justify-center gap-3 py-2.5 text-center">
        <p className="text-[0.8rem] font-medium tracking-wide">
          {settings.announcement.text}
          {settings.announcement.link && (
            <Link to={settings.announcement.link} className="ml-2 underline decoration-caramel-400 underline-offset-4 hover:text-caramel-300">
              Shop now
            </Link>
          )}
        </p>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss announcement"
          className="absolute right-4 rounded-full p-1 text-cream-300/70 transition-colors hover:bg-cocoa-700 hover:text-cream-100"
        >
          <FiX className="text-sm" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBar;
