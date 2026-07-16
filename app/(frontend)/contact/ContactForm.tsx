"use client";

import { useActionState, useEffect, useRef } from "react";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

type ContactFormProps = {
  action: (
    previousState: ContactFormState,
    formData: FormData,
  ) => Promise<ContactFormState>;
};

const initialState: ContactFormState = {
  status: "idle",
  message: "",
};

export function ContactForm({ action }: ContactFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state.status]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="grid gap-5 rounded-lg border border-stone-200 bg-white p-6"
    >
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[#15231f]">お名前</span>
        <input
          name="name"
          required
          disabled={pending}
          className="min-h-12 rounded-md border border-stone-300 px-3 outline-none transition focus:border-[#2f6f73] focus:ring-2 focus:ring-[#2f6f73]/20 disabled:cursor-not-allowed disabled:bg-stone-100"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[#15231f]">件名</span>
        <input
          name="subject"
          required
          disabled={pending}
          className="min-h-12 rounded-md border border-stone-300 px-3 outline-none transition focus:border-[#2f6f73] focus:ring-2 focus:ring-[#2f6f73]/20 disabled:cursor-not-allowed disabled:bg-stone-100"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[#15231f]">
          メールアドレス
        </span>
        <input
          name="email"
          type="email"
          required
          disabled={pending}
          className="min-h-12 rounded-md border border-stone-300 px-3 outline-none transition focus:border-[#2f6f73] focus:ring-2 focus:ring-[#2f6f73]/20 disabled:cursor-not-allowed disabled:bg-stone-100"
        />
      </label>
      <label className="grid gap-2">
        <span className="text-sm font-semibold text-[#15231f]">相談内容</span>
        <textarea
          name="message"
          required
          disabled={pending}
          rows={7}
          className="rounded-md border border-stone-300 px-3 py-3 outline-none transition focus:border-[#2f6f73] focus:ring-2 focus:ring-[#2f6f73]/20 disabled:cursor-not-allowed disabled:bg-stone-100"
        />
      </label>

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          aria-live="polite"
          className={
            state.status === "success"
              ? "rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
              : "rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          }
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-fit items-center justify-center rounded-md bg-[#15231f] px-5 text-sm font-semibold text-white transition hover:bg-[#284139] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "送信中..." : "送信する"}
      </button>
    </form>
  );
}
