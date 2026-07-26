import React, { useState, useEffect, useRef } from "react";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Loader2, Save, Trash2, Edit2, Twitter, Linkedin, Instagram, PenTool, ImagePlus, X, LayoutGrid } from "lucide-react";
import { platformLimits, validatePost } from "./utils/validation";
import { saveDraftMock, retry } from "./utils/api";

const PlatformIcon = ({ platform, size = 18 }) => {
  switch (platform) {
    case 'Twitter': return <Twitter size={size} />;
    case 'LinkedIn': return <Linkedin size={size} />;
    case 'Instagram': return <Instagram size={size} />;
    default: return null;
  }
};

const CircularProgress = ({ percent, isWarning, isDanger }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;
  
  let strokeColor = "var(--primary)";
  if (isDanger) strokeColor = "var(--danger)";
  else if (isWarning) strokeColor = "var(--warning)";

  return (
    <div className="circular-progress">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={radius} className="progress-bg" />
        <circle 
          cx="20" cy="20" r={radius} 
          className="progress-value"
          style={{ strokeDasharray: circumference, strokeDashoffset, stroke: strokeColor }}
        />
      </svg>
    </div>
  );
};

function App() {
  const [content, setContent] = useState("");
  const [platform, setPlatform] = useState("Twitter");
  const [drafts, setDrafts] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [image, setImage] = useState(null); 
  const fileInputRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem("social_drafts_v4");
    if (saved) {
      try {
        setDrafts(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse drafts", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("social_drafts_v4", JSON.stringify(drafts));
  }, [drafts]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image is too large. Max size is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveDraft = async () => {
    if (!content.trim() && !image) {
        toast.warn("Post cannot be empty.");
        return;
    }

    if (!validatePost(content, platform)) {
      toast.error(`Exceeds limit for ${platform}`);
      return;
    }

    setIsSaving(true);
    try {
      await retry(() => saveDraftMock({ platform, content, image }, false), 3);
      setDrafts([{ id: Date.now(), platform, content, image }, ...drafts]);
      setContent("");
      setImage(null);
      if(fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Draft securely saved.");
    } catch (error) {
      toast.error("Network instability. Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadDraft = (draft) => {
    setPlatform(draft.platform);
    setContent(draft.content);
    setImage(draft.image || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info("Draft loaded into composer");
  };

  const limit = platformLimits[platform];
  const length = content.length;
  const remaining = limit - length;
  const isInvalid = remaining < 0;
  const isWarning = remaining > 0 && remaining <= 20;
  const progressPercent = Math.min((length / limit) * 100, 100);

  return (
    <div className="dark-app">
      <ToastContainer position="bottom-center" theme="dark" transition={Slide} hideProgressBar toastClassName="sleek-toast" />

      <main className="main-content">
        <header className="page-header">
          <h1><PenTool size={28} /> Composer Studio</h1>
          <p>Create, validate, and manage your social drafts seamlessly.</p>
        </header>

        {/* COMPOSER SECTION */}
        <section className="composer-section card">
          <div className="composer-header">
            <div className="platform-selector">
              {Object.keys(platformLimits).map(p => (
                <button 
                  key={p}
                  className={`platform-btn ${platform === p ? 'active' : ''}`}
                  onClick={() => setPlatform(p)}
                >
                  <PlatformIcon platform={p} />
                  <span>{p}</span>
                </button>
              ))}
            </div>
          </div>

          <div className={`editor-container ${isFocused ? 'focused' : ''}`}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={`What's happening on ${platform}?`}
              className="sleek-textarea"
            />
            
            {image && (
              <div className="attachment-preview">
                <img src={image} alt="Attachment Preview" />
                <button className="remove-attachment-btn" onClick={() => setImage(null)} title="Remove Image">
                  <X size={14} />
                </button>
              </div>
            )}

            <div className="editor-toolbar">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                style={{ display: 'none' }} 
                ref={fileInputRef}
              />
              <button className="toolbar-btn" onClick={() => fileInputRef.current.click()}>
                <ImagePlus size={16} /> Attach Media
              </button>
            </div>
          </div>

          <footer className="composer-footer">
            <div className="stats-group">
              <CircularProgress percent={progressPercent} isWarning={isWarning} isDanger={isInvalid} />
              <div className="char-info">
                <span className={`count ${isInvalid ? 'danger' : isWarning ? 'warning' : ''}`}>
                  {isInvalid ? `-${Math.abs(remaining)}` : remaining}
                </span>
                <span className="label">characters left</span>
              </div>
            </div>

            <button 
              className={`publish-btn ${isSaving ? 'saving' : ''}`}
              onClick={handleSaveDraft}
              disabled={isSaving || isInvalid || (!content.trim() && !image)}
            >
              {isSaving ? <Loader2 className="spinner" size={20} /> : <Save size={20} />}
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
          </footer>
        </section>

        {/* DRAFTS GRID SECTION */}
        <section className="drafts-section">
          <div className="drafts-header">
            <h2><LayoutGrid size={22} /> Your Drafts <span className="draft-count">{drafts.length}</span></h2>
          </div>

          {drafts.length === 0 ? (
            <div className="empty-zone card">
              <div className="empty-icon-box">
                <PlatformIcon platform={platform} size={32} />
              </div>
              <p>No drafts yet. Start typing above to create one!</p>
            </div>
          ) : (
            <div className="drafts-grid">
              {drafts.map((draft) => (
                <div key={draft.id} className="draft-card card">
                  <div className="draft-card-header">
                    <span className="draft-badge">
                      <PlatformIcon platform={draft.platform} size={14} />
                      {draft.platform}
                    </span>
                    <div className="draft-actions">
                      <button onClick={() => handleLoadDraft(draft)} className="action-btn edit" title="Load Draft">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => setDrafts(drafts.filter(d => d.id !== draft.id))} className="action-btn delete" title="Delete Draft">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="draft-card-body">
                    {draft.content && <p className="draft-text">{draft.content}</p>}
                    
                    {draft.image && (
                      <div className="draft-image-thumbnail">
                        <img src={draft.image} alt="Draft Attachment" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
