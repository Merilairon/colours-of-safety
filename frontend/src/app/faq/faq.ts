import { Component } from '@angular/core';
import { SeoService } from '../core/seo.service';

interface FaqItem {
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class FaqComponent {
  protected readonly faqs: FaqItem[] = [
    {
      question: 'What is Colours of Safety?',
      answer:
        'Colours of Safety is a community-driven platform that maps LGBTQIA+ friendly safe spaces worldwide. Users can discover, submit, and review queer-welcoming venues, bars, cafes, healthcare providers, and entire safe districts.',
    },
    {
      question: 'How do I submit a safe space?',
      answer:
        'Create a free account, navigate to the map, and click "Add Place" or "Add District". Fill in the details including name, category, safety rating, and location. Your submission will be reviewed by our community moderators before appearing publicly.',
    },
    {
      question: 'How are submissions reviewed?',
      answer:
        'All submissions go through a community moderation process. Trusted reviewers verify that submissions meet our safety guidelines, have accurate locations, and genuinely provide a welcoming environment for LGBTQIA+ individuals.',
    },
    {
      question: 'What do the safety ratings mean?',
      answer:
        'Safety ratings range from 1-5 and reflect how welcoming and safe a space is for LGBTQIA+ people: 5 = Exceptionally safe and inclusive, 4 = Generally welcoming, 3 = Moderately safe, 2 = Caution advised, 1 = Not recommended. Ratings are based on community feedback and moderation.',
    },
    {
      question: 'Is my data private?',
      answer:
        'Yes. We collect minimal data and never share your personal information with third parties. You can also submit places anonymously. See our Privacy Policy for complete details on data handling.',
    },
    {
      question: 'Can I edit or delete my submission?',
      answer:
        'Yes, you can edit or delete submissions that are still pending review. Once approved, submissions become part of the community map and cannot be removed by individual users to maintain data integrity.',
    },
    {
      question: 'What is a "safe district"?',
      answer:
        'Safe districts are geographic areas (neighborhoods, villages, city quarters) that have been identified as generally welcoming and safe for LGBTQIA+ individuals. They appear as shaded areas on the map with safety ratings for the entire region.',
    },
    {
      question: 'How can I become a reviewer?',
      answer:
        'Experienced community members can be promoted to reviewer status by administrators. Reviewers help moderate submissions to ensure quality and accuracy. Contact an admin through the platform if you are interested in contributing as a reviewer.',
    },
  ];

  constructor(private readonly seo: SeoService) {
    this.seo.updateSeo({
      title: 'FAQ | Colours of Safety',
      description:
        'Frequently asked questions about Colours of Safety - how to submit safe spaces, review process, safety ratings, and more.',
      keywords: 'FAQ, LGBTQ safe spaces, how to submit, community moderation, safety ratings',
      canonicalUrl: 'https://coloursofsafety.com/faq',
    });
  }
}
