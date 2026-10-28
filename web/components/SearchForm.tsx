export function SearchForm({ defaultValue = "", id = "q" }: { defaultValue?: string; id?: string }) {
  return (
    <form className="search" action="/search" role="search">
      <label htmlFor={id} className="visually-hidden">Search agendas and staff reports</label>
      <input id={id} name="q" type="search" defaultValue={defaultValue} placeholder="Search a street, topic, or company" />
      <button type="submit">Search</button>
    </form>
  );
}
