import {GetStaticProps} from "next";
import MainLayout from "@/components/layouts/main";
import MetaTags from "@/components/metatags";
import cn from "@edgedb/common/utils/classNames";
import {ProSubscriptionIcon} from "@/components/icons";
import {useBreakpoint} from "@edgedb-site/shared/hooks/useBreakpoint";
import PricingModal from "@/components/pricing/pricingModal";
import {useOverlayTypeActive} from "@edgedb-site/shared/hooks/useOverlayActive";
import PricingSlider from "@/components/pricing/slider";
import {getBillableData, formatResources} from "@/components/pricing/utils";
import {PricingTiers} from "@/components/pricing/types";
import type {BillableData} from "@/components/pricing/types";
import {Tiers} from "@edgedb-site/shared/utils/getLoginUrl";
import Env from "@/components/cloud/env";
import styles from "@/styles/pricing.module.scss";

const tiers = [Tiers.free, Tiers.pro, Tiers.enterprise];

interface PricingCardsProps extends BillableData {
  openModal: (type: Tiers | null) => void;
}

const PricingCards = ({
  computeBillable,
  computeUnitPrice,
  unitsBundled,
  unitPrices,
  openModal,
}: PricingCardsProps) => {
  const breakpoint = useBreakpoint();
  const isMobile = breakpoint === "xs" || breakpoint === "sm";

  const billableDisplayUnit = computeBillable.display_unit;

  const freeBillableQuota = computeBillable.default_instance_limits!.find(
    (item) => item.tier === PricingTiers.enum.Free
  )?.limit!;

  const resources = computeBillable.resources;
  const formattedResources = formatResources(resources, freeBillableQuota);

  const optionCards = [
    <div className={styles.tier} key={tiers[0]}>
      <p className={styles.type}>{tiers[0]}</p>
      <p className={styles.desc}>Explore EdgeDB Cloud for free.</p>
      <p className={styles.title}>
        <span className={styles.price}>$0</span>
        <span className={styles.small}> /month</span>
      </p>
      <ul>
        <li>
          {`${freeBillableQuota} ${billableDisplayUnit} `}
          <span>({formattedResources})</span>
        </li>
        <li>Up to 1GB of disk space</li>
        <li>Data encrypted at rest</li>
        <li>Community support</li>
      </ul>
      <button
        className={cn(styles.subscribeCta, styles.twoLine)}
        onClick={() => openModal(Tiers.free)}
      >
        Get started
      </button>
    </div>,
    <div className={cn(styles.tier, styles.pro)} key={tiers[1]}>
      <p className={styles.type}>
        <ProSubscriptionIcon />
        {tiers[1]}
      </p>
      <p className={styles.desc}>Tailor EdgeDB Cloud to your needs.</p>
      <PricingSlider
        computeBillable={computeBillable}
        computeUnitPrice={computeUnitPrice}
      />
      <ul>
        <li>
          {unitsBundled.storage}
          <span> ({unitPrices.storage} afterwards)</span>
        </li>
        <li>
          {unitsBundled.transfer}
          <span> ({unitPrices.transfer} afterwards)</span>
        </li>
        <li>Unlimited number of reads/writes</li>
        <li>Email support</li>
      </ul>
      <button
        className={cn(styles.subscribeCta, styles.pro)}
        onClick={() => openModal(Tiers.pro)}
      >
        Get started
      </button>
    </div>,
    <div className={styles.tier} key={tiers[2]}>
      <p className={styles.type}>{tiers[2]}</p>
      <p className={styles.desc}>A completely custom Cloud experience.</p>
      <p className={styles.title}>Custom pricing</p>
      <ul>
        <li>Priority support</li>
        <li>Deploy in your AWS account</li>
        <li>Custom contracts</li>
        <li>Custom pricing based on requirements</li>
        <li>Volume discounts</li>
      </ul>
      <button
        className={styles.subscribeCta}
        onClick={() => openModal(Tiers.enterprise)}
      >
        Talk to us
      </button>
    </div>,
  ];

  return (
    <>
      {isMobile ? (
        <div className={styles.mobileTiers}>{optionCards}</div>
      ) : (
        <div className={styles.tiers}>{optionCards}</div>
      )}
    </>
  );
};

const PricingPage = (billableData: BillableData) => {
  const [activeModal, setActiveModal] = useOverlayTypeActive<Tiers>("Pricing");

  return (
    <MainLayout className={styles.page} footerClassName={styles.pageFooter}>
      <MetaTags title="Pricing" description={``} relPath="/pricing" />
      <Env />
      {activeModal && <PricingModal />}

      <div className="globalPageWrapper">
        <div className={styles.content}>
          <h1>Pricing</h1>
          <PricingCards {...billableData} openModal={setActiveModal} />
          <p className={styles.pricingNote}>
            All prices are given in USD for the aws-us-east-2 region.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};

export default PricingPage;

export const getStaticProps: GetStaticProps<BillableData> = async () => ({
  props: await getBillableData(),
});
