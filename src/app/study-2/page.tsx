import { redirect } from "next/navigation";

type StudyEntryPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function toSearchString(params: Record<string, string | string[] | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item) {
          search.append(key, item);
        }
      });
      return;
    }

    if (value) {
      search.set(key, value);
    }
  });

  const searchString = search.toString();
  return searchString ? `?${searchString}` : "";
}

export default async function Study2EntryPage({ searchParams }: StudyEntryPageProps) {
  const resolvedSearchParams = await searchParams;
  redirect(`/study/study2/page/1${toSearchString(resolvedSearchParams)}`);
}
