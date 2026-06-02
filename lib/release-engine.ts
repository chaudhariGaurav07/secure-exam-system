export function canReleasePaper(
  examDate: string,
  examTime: string
) {
  const now = new Date();

  const releaseDate =
    new Date(
      `${examDate}T${examTime}`
    );

  return now >= releaseDate;
}