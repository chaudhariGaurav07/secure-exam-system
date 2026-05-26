import { Question } from "@/models/Question";
import { decrypt } from "@/lib/encryption";

export async function generatePaperSets(template: any) {
  const sets = [];

  for (let setNo = 1; setNo <= 5; setNo++) {
    const paperQuestions = [];

    for (const block of template.structure) {
      const rawQuestions = await Question.aggregate([
        {
          $match: {
            status:  "approved",
            subject: template.subject,
          },
        },
        {
          $sample: { size: block.candidatesNeeded },
        },
      ]);

      // Decrypt each question before returning — callers never see ciphertext
      const questions = rawQuestions.map((q) => {
        const { encryptedQuestion, ...rest } = q;
        try {
          return {
            ...rest,
            question: decrypt(encryptedQuestion),
          };
        } catch {
          // If decryption fails, omit the question rather than crash
          return null;
        }
      }).filter(Boolean);

      paperQuestions.push({ block, questions });
    }

    sets.push({ setNo, paperQuestions });
  }

  return sets;
}