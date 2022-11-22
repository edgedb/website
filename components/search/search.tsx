import {useContext} from "react";

import {IndexPrefetch} from "@/components/search";
import SearchPanel from "@/components/search/panel";
import {useSearchContext} from "@/components/search/context";
import {
  getDocsIndexDef,
  getTutorialIndexDef,
  getEasyEDBIndexDef,
} from "@/components/search/indexDefs";

import {DocVersionContext} from "@/components/docs/contexts";

interface SearchProps {
  docsVersion?: string;
  defaultIndexId?: string;
}

export default function Search({docsVersion, defaultIndexId}: SearchProps) {
  const {panelOpen} = useSearchContext();
  const versionId = docsVersion ?? useContext(DocVersionContext);

  const indexes = {
    ...getDocsIndexDef(versionId),
    ...getTutorialIndexDef(),
    ...getEasyEDBIndexDef("en"),
  };

  return (
    <>
      <IndexPrefetch indexes={indexes} />
      {panelOpen ? (
        <SearchPanel
          indexes={indexes}
          defaultIndexId={defaultIndexId ?? `docs${versionId}`}
        />
      ) : null}
    </>
  );
}
