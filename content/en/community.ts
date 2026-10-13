import type { CommunityCopy } from '../types';
import { PH } from '../governance';

export const community: CommunityCopy = {
  eyebrow: 'Community',
  title: 'Ideas grow when they meet the right people.',
  text: 'In the Rainmakers WhatsApp communities you can ask questions, meet other founders and find opportunities.',
  listTitle: 'Choose your community',
  join: 'Join on WhatsApp',
  full: 'Full',
  comingSoon: 'Coming soon',
  linkMissing: PH.whatsapp,
  categoryLabel: 'Topic',
  targetLabel: 'For',
  note: 'Not sure which one to choose?',
  form: {
    intro: 'Leave your name and email and we’ll show you the link to join right away.',
    firstName: 'First name',
    email: 'Email',
    consent: 'I agree to the processing of my data to handle my request to join the community. This is not a newsletter subscription.',
    privacy: 'Privacy policy',
    submit: 'Continue',
    submitting: 'Sending…',
    cancel: 'Cancel',
    success: 'Done! Here is the link to join the community.',
    open: 'Open WhatsApp',
    errors: {
      required: 'Please fill in this field.',
      email: 'Please enter a valid email address.',
      consent: 'We need your consent to process your data.',
      tooLong: 'This text is too long.',
      summary: 'Please check the highlighted fields.',
      generic: 'We could not send your request. Please try again in a moment.',
      rateLimited: 'Too many requests. Please try again in a few minutes.',
    },
  },
};
