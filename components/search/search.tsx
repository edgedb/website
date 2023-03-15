import {IndexPrefetch} from "@/components/search";
import SearchPanel from "@/components/search/panel";
import {useSearchContext} from "@/components/search/context";
import {
  getDocsIndexDef,
  getTutorialIndexDef,
  getEasyEDBIndexDef,
} from "@/components/search/indexDefs";

interface SearchProps {
  defaultIndexId?: string;
}

export default function Search({defaultIndexId}: SearchProps) {
  const {panelOpen} = useSearchContext();

  const indexes = {
    ...getDocsIndexDef(),
    ...getTutorialIndexDef(),
    ...getEasyEDBIndexDef("en"),
  };

  return (
    <>
      <IndexPrefetch indexes={indexes} />
      {panelOpen ? (
        <SearchPanel
          indexes={indexes}
          defaultIndexId={defaultIndexId ?? `docs`}
        />
      ) : null}
    </>
  );
}
