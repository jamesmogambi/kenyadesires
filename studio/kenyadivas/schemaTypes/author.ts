import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'author',
  title: 'Author',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: (Rule) => Rule.required().error('Author name is required'),
    }),
    defineField({
      name: 'image',
      title: 'Profile Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alt Text',
          description: 'Description of the image for accessibility',
        },
      ],
    }),
    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      rows: 3,
      description: 'Brief biography of the author',
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.email().warning('Please enter a valid email'),
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'object',
      fields: [
        {
          name: 'twitter',
          title: 'Twitter/X',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({
              scheme: ['https'],
            }).warning('Please enter a valid URL'),
        },
        {
          name: 'instagram',
          title: 'Instagram',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({
              scheme: ['https'],
            }).warning('Please enter a valid URL'),
        },
        {
          name: 'linkedin',
          title: 'LinkedIn',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({
              scheme: ['https'],
            }).warning('Please enter a valid URL'),
        },
        {
          name: 'website',
          title: 'Website',
          type: 'url',
          validation: (Rule) =>
            Rule.uri({
              scheme: ['http', 'https'],
            }).warning('Please enter a valid URL'),
        },
      ],
    }),
    defineField({
      name: 'role',
      title: 'Role',
      type: 'string',
      description: 'e.g., Editor, Contributor, Guest Writer',
      options: {
        list: [
          { title: 'Editor', value: 'editor' },
          { title: 'Contributor', value: 'contributor' },
          { title: 'Guest Writer', value: 'guest' },
          { title: 'Admin', value: 'admin' },
        ],
      },
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'role',
      media: 'image',
    },
    prepare({ title, subtitle, media }) {
      return {
        title: title || 'Unnamed Author',
        subtitle: subtitle || 'No role set',
        media,
      }
    },
  },
})