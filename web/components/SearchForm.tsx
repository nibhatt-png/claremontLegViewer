import { Icon } from "./Icon";

/** Keyword and/or date search. Either field alone works. */
export function SearchForm({ defaultValue = "", defaultDate = "", id = "q" }: {
  defaultValue?: string;
  defaultDate?: string;
  id?: string;
}) {
  return (
    <form className="searchbar" action="/search" role="search">
      <div className="field q">
        <Icon name="search" />
        <label htmlFor={id} className="visually-hidden">Topic or keyword</label>
        <input id={id} name="q" type="search" defaultValue={defaultValue} placeholder="A topic, like parks or housing" />
      </div>
      <div className="field d">
        <Icon name="calendar" />
        <label htmlFor={`${id}-date`} className="visually-hidden">Meeting date</label>
        <input id={`${id}-date`} name="date" type="date" defaultValue={defaultDate} />
      </div>
      <button type="submit">Search</button>
    </form>
  );
}
