export function SearchForm({
  defaultValue = "",
  id = "q",
  large = false,
}: {
  defaultValue?: string;
  id?: string;
  large?: boolean;
}) {
  return (
    <form className={`search${large ? " large" : ""}`} action="/search" role="search">
      <label htmlFor={id} className="visually-hidden">Search agendas and staff reports</label>
      <input id={id} name="q" type="search" defaultValue={defaultValue} placeholder="Search a street, business or topic" />
      <button className="button" type="submit">Search</button>
    </form>
  );
}
