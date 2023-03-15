import {useState} from "react";
import ReactPaginate from "react-paginate";

import MediaCard, {Article} from "../mediaCard";
import {ArrowLeftIcon, ArrowRightIcon} from "@/components/icons/about";
import styles from "./media.module.scss";

interface MediaProps {
  items: Article[];
}

const itemsPerPage = 3;

const Media = ({items}: MediaProps) => {
  const [currentPage, setCurrentPage] = useState(1);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageClick = ({selected}: {selected: number}) => {
    setCurrentPage(selected + 1);
  };

  return (
    <div className={styles.container}>
      <div className={styles.media}>
        {currentItems.map((item) => (
          <MediaCard {...item} key={item.link} />
        ))}
      </div>
      <ReactPaginate
        breakLabel="..."
        pageRangeDisplayed={1}
        marginPagesDisplayed={1}
        onPageChange={handlePageClick}
        pageCount={Math.ceil(items.length / itemsPerPage)}
        previousLabel={<ArrowLeftIcon />}
        nextLabel={<ArrowRightIcon />}
        containerClassName={styles.pagination}
        pageLinkClassName={styles.pageNumber}
        previousLinkClassName={styles.previousNext}
        nextLinkClassName={styles.previousNext}
        breakLinkClassName={styles.pageNumber}
        activeLinkClassName={styles.active}
        disabledLinkClassName={styles.disabled}
      />
    </div>
  );
};

export default Media;
