import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Category Name',
      type: 'string',
      validation: (Rule) => Rule.required().error('Category name is required'),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required().error('Slug is required'),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Brief description of the category (used for SEO)',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Emoji for the category (e.g., 💕, ❤️, 📱)',
    }),
    defineField({
      name: 'color',
      title: 'Color',
      type: 'string',
      options: {
        list: [
          { title: 'Blue', value: 'blue' },
          { title: 'Purple', value: 'purple' },
          { title: 'Pink', value: 'pink' },
          { title: 'Green', value: 'green' },
          { title: 'Orange', value: 'orange' },
          { title: 'Red', value: 'red' },
          { title: 'Yellow', value: 'yellow' },
        ],
      },
      description: 'Color for the category badge',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which categories appear (lower numbers first)',
    }),
    defineField({
      name: 'featured',
      title: 'Featured Category',
      type: 'boolean',
      description: 'Show this category on the homepage',
      initialValue: false,
    }),
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'slug.current',
      media: 'icon',
    },
    prepare({ title, subtitle }) {
      return {
        title: title || 'Untitled Category',
        subtitle: subtitle ? `/${subtitle}` : 'No slug set',
      }
    },
  },
  orderings: [
    {
      title: 'Order',
      name: 'order',
      by: [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Name',
      name: 'name',
      by: [{ field: 'name', direction: 'asc' }],
    },
  ],
})