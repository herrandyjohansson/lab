import { useEffect, useState } from "react";
import type { ProductLinkDto, ProductMetadataRequestDto } from "./types";
import { useProductDetails } from "./useProductDetails";
import { useProductMetadata } from "./useProductMetadata";

interface ProductDetailsModalProps {
  productId: number | null;
  onClose: () => void;
}

function PropertySection({
  title,
  properties,
}: {
  title: string;
  properties: Array<{ label: string; value: string | null | undefined }>;
}) {
  const validProperties = properties.filter(
    (p) => p.value != null && p.value !== ""
  );

  if (validProperties.length === 0) return null;

  return (
    <div className="product-details-section">
      <h3>{title}</h3>
      <div className="product-details-properties">
        {validProperties.map((prop, idx) => (
          <div key={idx} className="product-details-property">
            <span className="property-label">{prop.label}:</span>
            <span className="property-value">{prop.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MetadataForm({
  productId: _productId,
  initialLinks,
  initialExtraDescription,
  initialResponsible,
  initialImage,
  onSave,
  saving,
}: {
  productId: number;
  initialLinks: ProductLinkDto[];
  initialExtraDescription: string | null;
  initialResponsible: string | null;
  initialImage: string | null;
  onSave: (metadata: ProductMetadataRequestDto) => Promise<void>;
  saving: boolean;
}) {
  const [links, setLinks] = useState<ProductLinkDto[]>(initialLinks);
  const [extraDescription, setExtraDescription] = useState<string>(initialExtraDescription || "");
  const [responsible, setResponsible] = useState<string>(initialResponsible || "");
  const [image, setImage] = useState<string>(initialImage || "");

  // Sync form state when metadata updates
  useEffect(() => {
    setLinks(initialLinks);
    setExtraDescription(initialExtraDescription || "");
    setResponsible(initialResponsible || "");
    setImage(initialImage || "");
  }, [initialLinks, initialExtraDescription, initialResponsible, initialImage]);
  const [newLink, setNewLink] = useState({ title: "", url: "", type: "" });
  const [showAddLink, setShowAddLink] = useState(false);

  const handleAddLink = () => {
    if (newLink.title && newLink.url) {
      setLinks([...links, { ...newLink, type: newLink.type || null }]);
      setNewLink({ title: "", url: "", type: "" });
      setShowAddLink(false);
    }
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const payload: ProductMetadataRequestDto = {};
    
    if (links.length > 0) {
      payload.links = links;
    }
    
    const trimmedExtraDescription = extraDescription.trim();
    if (trimmedExtraDescription) {
      payload.extraDescription = trimmedExtraDescription;
    }
    
    const trimmedResponsible = responsible.trim();
    if (trimmedResponsible) {
      payload.responsible = trimmedResponsible;
    }
    
    const trimmedImage = image.trim();
    if (trimmedImage) {
      payload.image = trimmedImage;
    }
    
    await onSave(payload);
  };

  return (
    <div className="metadata-form">
      <h3>Product Metadata</h3>
      
      <div className="metadata-section">
        <div className="metadata-section-header">
          <h4>Links</h4>
          {!showAddLink && (
            <button
              type="button"
              className="btn-add"
              onClick={() => setShowAddLink(true)}
            >
              + Add Link
            </button>
          )}
        </div>

        {showAddLink && (
          <div className="metadata-add-form">
            <input
              type="text"
              placeholder="Title"
              value={newLink.title}
              onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
            />
            <input
              type="url"
              placeholder="URL"
              value={newLink.url}
              onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
            />
            <input
              type="text"
              placeholder="Type (optional)"
              value={newLink.type}
              onChange={(e) => setNewLink({ ...newLink, type: e.target.value })}
            />
            <div className="metadata-form-actions">
              <button type="button" onClick={handleAddLink}>Add</button>
              <button type="button" onClick={() => { setShowAddLink(false); setNewLink({ title: "", url: "", type: "" }); }}>Cancel</button>
            </div>
          </div>
        )}

        {links.length > 0 ? (
          <div className="metadata-list">
            {links.map((link, index) => (
              <div key={index} className="metadata-item">
                <div className="metadata-item-content">
                  <strong>{link.title}</strong>
                  <a href={link.url} target="_blank" rel="noopener noreferrer">{link.url}</a>
                  {link.type && <span className="metadata-badge">{link.type}</span>}
                </div>
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => handleRemoveLink(index)}
                  aria-label="Remove link"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          !showAddLink && <p className="metadata-empty">No links added</p>
        )}
      </div>

      <div className="metadata-section">
        <h4>Additional Information</h4>
        <div className="metadata-fields">
          <div className="metadata-field">
            <label htmlFor="extraDescription">Extra Description</label>
            <textarea
              id="extraDescription"
              placeholder="Additional description text for the product"
              value={extraDescription}
              onChange={(e) => setExtraDescription(e.target.value)}
              rows={4}
              className="metadata-textarea"
            />
          </div>
          <div className="metadata-field">
            <label htmlFor="responsible">Responsible</label>
            <input
              id="responsible"
              type="email"
              placeholder="Email or identifier of responsible person"
              value={responsible}
              onChange={(e) => setResponsible(e.target.value)}
              className="metadata-input-full"
            />
          </div>
          <div className="metadata-field">
            <label htmlFor="image">Image URL</label>
            <input
              id="image"
              type="url"
              placeholder="URL to product image"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="metadata-input-full"
            />
            {image && (
              <div className="metadata-image-preview">
                <img src={image} alt="Product preview" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="metadata-save-section">
        <button
          type="button"
          className="btn-save"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Metadata"}
        </button>
      </div>
    </div>
  );
}

export function ProductDetailsModal({
  productId,
  onClose,
}: ProductDetailsModalProps) {
  const { data, loading, error } = useProductDetails(productId);
  const { data: metadata, loading: metadataLoading, error: metadataError, saving, saveMetadata } = useProductMetadata(productId);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (productId) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [productId, onClose]);

  if (!productId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Product Details</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="modal-loading">
              <p>Loading product details...</p>
            </div>
          )}

          {error && (
            <div className="modal-error">
              <p>Error: {error}</p>
            </div>
          )}

          {data && (
            <>
              <div className="product-details-header">
                <div className="product-header-top">
                  <h1>{data.name}</h1>
                  <span className="product-id">ID: {data.id}</span>
                </div>
                {data.properties?.officialFullName && (
                  <p className="product-full-name">
                    {data.properties.officialFullName}
                  </p>
                )}
                <div className="product-basic-info">
                  <span className="product-badge">{data.category}</span>
                  <span className="product-badge">{data.type}</span>
                  {data.properties?.active === "1" && (
                    <span className="product-badge active">Active</span>
                  )}
                </div>
              </div>

              {data.properties && (
                <>
                  <PropertySection
                    title="Identification"
                    properties={[
                      {
                        label: "Product Family",
                        value: data.properties.productFamily,
                      },
                      {
                        label: "Product Line",
                        value: data.properties.productLine,
                      },
                      { label: "PS Line", value: data.properties.psLine },
                      { label: "Vendor", value: data.properties.vendor },
                      {
                        label: "Vendor Type",
                        value: data.properties.vendorType,
                      },
                      { label: "Series", value: data.properties.series },
                      { label: "Short Name", value: data.properties.shortName },
                      {
                        label: "CN Product Name",
                        value: data.properties.cnProdName,
                      },
                    ]}
                  />

                  <PropertySection
                    title="Classification"
                    properties={[
                      {
                        label: "Product Type",
                        value: data.properties.productType,
                      },
                      {
                        label: "Product Group",
                        value: data.properties.productGroup,
                      },
                      {
                        label: "Product Segment",
                        value: data.properties.productSegment,
                      },
                      {
                        label: "Form Factor",
                        value: data.properties.formFactor,
                      },
                      {
                        label: "PIA Category",
                        value: data.properties.piaCategory,
                      },
                    ]}
                  />

                  <PropertySection
                    title="Physical Properties"
                    properties={[
                      {
                        label: "Outdoor Ready",
                        value: data.properties.outdoorReady,
                      },
                      {
                        label: "Dimensions",
                        value:
                          data.properties.boxWidth &&
                          data.properties.boxHeight &&
                          data.properties.boxDepth
                            ? `${data.properties.boxWidth} × ${data.properties.boxHeight} × ${data.properties.boxDepth} mm`
                            : null,
                      },
                    ]}
                  />

                  <PropertySection
                    title="Dates"
                    properties={[
                      {
                        label: "Release Date",
                        value: data.properties.externalReleaseDate,
                      },
                      {
                        label: "End of Life",
                        value: data.properties.endOfLifeDate,
                      },
                      {
                        label: "End of Support",
                        value: data.properties.endOfSupportDate,
                      },
                    ]}
                  />

                  <PropertySection
                    title="Warranty & Support"
                    properties={[
                      {
                        label: "Standard Warranty",
                        value: data.properties.stdWarranty
                          ? `${data.properties.stdWarranty} years`
                          : null,
                      },
                      {
                        label: "Supportal Included",
                        value: data.properties.supportalIncluded,
                      },
                      {
                        label: "New Product Days",
                        value: data.properties.newProductNumberOfDays
                          ? `${data.properties.newProductNumberOfDays} days`
                          : null,
                      },
                    ]}
                  />

                  <PropertySection
                    title="Technical"
                    properties={[
                      { label: "Channels", value: data.properties.channels },
                      { label: "Compare", value: data.properties.compare },
                      {
                        label: "Scale Quantity",
                        value: data.properties.scaleQuantity,
                      },
                    ]}
                  />

                  <PropertySection
                    title="Project Information"
                    properties={[
                      {
                        label: "Project Name",
                        value: data.properties.projectName,
                      },
                      {
                        label: "Project URL",
                        value: data.properties.projectURL,
                      },
                      { label: "Docman ID", value: data.properties.docmanId },
                    ]}
                  />

                  <PropertySection
                    title="Metadata"
                    properties={[
                      {
                        label: "Catalog Group",
                        value: data.properties.catalogGroup,
                      },
                      { label: "Sprite ID", value: data.properties.spriteId },
                      { label: "Hardware ID", value: data.properties.hwId },
                      {
                        label: "Manufacturer ID",
                        value: data.properties.manufacturerId,
                      },
                      {
                        label: "Competitor Code",
                        value: data.properties.competitorCode,
                      },
                    ]}
                  />
                </>
              )}

              {/* Metadata Editing Form */}
              {data && (
                <div className="product-details-section">
                  {metadataLoading && (
                    <div className="metadata-loading">
                      <p>Loading metadata...</p>
                    </div>
                  )}
                  {metadataError && (
                    <div className="metadata-error">
                      <p>Error loading metadata: {metadataError}</p>
                    </div>
                  )}
                  {!metadataLoading && !metadataError && (
                    <MetadataForm
                      productId={productId}
                      initialLinks={metadata?.links || []}
                      initialExtraDescription={metadata?.extraDescription || null}
                      initialResponsible={metadata?.responsible || null}
                      initialImage={metadata?.image || null}
                      onSave={async (metadataRequest) => {
                        try {
                          await saveMetadata(metadataRequest);
                        } catch (err) {
                          console.error("Failed to save metadata:", err);
                        }
                      }}
                      saving={saving}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
