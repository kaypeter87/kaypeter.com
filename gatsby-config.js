module.exports = {
  siteMetadata: {
    siteTitle: 'Peter Kay',
    siteDescription: 'Monkey Engineering',
    siteImage: '/banner.png', // main image of the site for metadata
    siteUrl: 'https://kaypeter.com/',
    pathPrefix: '/',
    siteLanguage: 'en',
    ogLanguage: `en_US`,
    author: 'Peter Kay', // for example - 'Ivan Ganev'
    authorDescription: 'I monkey patch a bunch of stuff', // short text about the author
    avatar: '/avatar.jpg',
    twitterCreator: 'https://twitter.com/kaypeter87', // website account on twitter
    social: [
      {
        icon: `at`,
        url: `mailto:contact@kaypeter.com`
      },
      {
        icon: `twitter`,
        url: `https://twitter.com/kaypeter87`
      },
      {
        icon: `github-alt`,
        url: `https://github.com/kaypeter87`
      },
      {
        icon: `stackoverflow`,
        url: `https://stackoverflow.com/7087553/peter-kay`
      }
    ]
  },
  plugins: [
    {
      resolve: 'gatsby-theme-chronoblog',
      options: {
        uiText: {
          // ui text fot translate
          feedShowMoreButton: 'show more',
          feedSearchPlaceholder: 'search',
          cardReadMoreButton: 'read more →',
          allTagsButton: 'all tags'
        },
        feedItems: {
          // global settings for feed items
          limit: 50,
          yearSeparator: true,
          yearSeparatorSkipFirst: true,
          contentTypes: {
            links: {
              beforeTitle: '⬈ '
            }
          }
        },
        feedSearch: {
          symbol: ''
        }
      }
    },
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `Chronoblog Gatsby Theme`,
        short_name: `Chronoblog`,
        start_url: `/`,
        background_color: `#fff`,
        theme_color: `#3a5f7d`,
        display: `standalone`,
        icon: `src/assets/favicon.png`
      }
    },
    {
      resolve: `gatsby-plugin-sitemap`
    },
    {
      resolve: `gatsby-plugin-google-analytics`,
      options: {
        // replace "UA-XXXXXXXXX-X" with your own Tracking ID
        trackingId: 'UA-XXXXXXXXX-X'
      }
    }
  ]
};
