type EcosystemModelData = {
  entrepreneur: string;
  rainmakers: string;
  people: string;
  knowledge: string;
  community: string;
  rainforest: string;
  ecosystem: string;
  outcomes: string;
};

/**
 * PRD §69 — Final ecosystem model, rendered in HTML/CSS (not an image) so it stays
 * readable on mobile, translatable and indexable. Connectors are drawn with CSS.
 */
export function EcosystemModel({ model, label }: { model: EcosystemModelData; label: string }) {
  return (
    <figure className="eco-model reveal" aria-label={label}>
      <ol className="eco-model__flow">
        <li className="eco-model__row">
          <span className="eco-node eco-node--person">{model.entrepreneur}</span>
        </li>
        <li className="eco-model__row">
          <span className="eco-node eco-node--brand">{model.rainmakers}</span>
        </li>
        <li className="eco-model__row eco-model__row--split">
          <span className="eco-node">{model.people}</span>
          <span className="eco-node">{model.knowledge}</span>
          <span className="eco-node">{model.community}</span>
        </li>
        <li className="eco-model__row eco-model__row--merge">
          <span className="eco-node eco-node--forest">{model.rainforest}</span>
        </li>
        <li className="eco-model__row">
          <span className="eco-node eco-node--wide">{model.ecosystem}</span>
        </li>
        <li className="eco-model__row">
          <span className="eco-node eco-node--outcome">{model.outcomes}</span>
        </li>
      </ol>
    </figure>
  );
}
