panel.plugin('flokosiol/translations', {
  sections: {
    translations: {
      data: function () {
        return {
          id: null,
          deletable: null,
          revertable: null,
          translations: null
        }
      },
      computed: {
        defaultLanguage() {
          return this.$store.state.languages.default;
        },
        language() {
          return this.$store.state.languages.current;
        },
        languages() {
          return this.$store.state.languages.all.filter(language => language.default === false);
        }
      },
      created: function() {
        this.load().then(response => {
          // populate the data object when the section gets loaded
          // @see https://getkirby.com/docs/reference/plugins/extensions/sections#vue-component
          this.id           = response.id;
          this.deletable    = response.deletable;
          this.revertable   = response.revertable;
          this.translations = response.translations;

          // loop through all panel languages
          let languages = this.languages;
          for (let i = 0; i < languages.length; i++) {
            let languageCode = languages[i].code;

            // check if page is translated for this language
            if (this.translations.indexOf(languageCode) >= 0) {
              this.languages[i].icon = 'check';
              this.languages[i].theme = 'positive';
            }
            else {
              this.languages[i].icon = 'add';
              this.languages[i].theme = 'negative';
            }
          }
        });

      },
      methods: {
        change(language) {
          // #FIXME: disable deletable + revertable when using the default language switcher
          if (language.code === this.defaultLanguage.code || this.translations.indexOf(language.code) < 0) {
            this.deletable = false;
            this.revertable = false;
          }
          else {
            this.deletable = true;
            this.revertable = true;
          }
          this.$store.dispatch("languages/current", language);
          this.$emit("change", language);
        },
        deleteTranslationOpen(id, language) {
          this.$refs.deleteDialog.open(id, language);
        },
        deleteTranslationSubmit(id, language) {
          this.$api.post('flokosiol/translations/delete', {id: id, languageCode: language.code})
            .then(response => {
              this.$refs.deleteDialog.close();
              if (response.code === 200) {
                this.$store.dispatch('notification/success', response.text);
              }
              else {
                this.$store.dispatch('notification/error', response.text);
              }
            })
            .catch(error => {
              this.$store.dispatch('notification/error', error);
            });
        },
        revertTranslationOpen(id, language) {
          this.$refs.revertDialog.open(id, language);
        },
        revertTranslationSubmit(id, language) {
          this.$api.post('flokosiol/translations/revert', {id: id, languageCode: language.code})
            .then(response => {
              this.$refs.revertDialog.close();
              if (response.code === 200) {
                this.$store.dispatch('notification/success', response.text);
              }
              else {
                this.$store.dispatch('notification/error', response.text);
              }
            })
            .catch(error => {
              this.$store.dispatch('notification/error', error);
            });
        }
      },
      template: `
        <div class="k-field k-translations-field">
          <div v-if="languages.length">
            <k-button-group>
              <k-button icon="check" :class="{'translations--active': defaultLanguage.code === language.code }" theme="positive" :key="defaultLanguage.code" @click="change(defaultLanguage)">
                  {{ defaultLanguage.name }}
              </k-button>
              <k-button v-for="lang in languages" :class="{'translations--active': lang.code === language.code }" :icon="lang.icon" :theme="lang.theme" :key="lang.code" @click="change(lang)">
                {{ lang.name }}
              </k-button>
            </k-button-group>
          </div>

          <k-button-group>
            <k-button v-if="deletable" icon="trash" @click="deleteTranslationOpen(id, language)">
              {{ $t('delete') }} {{ language.code.toUpperCase() }}
            </k-button>
            <k-button v-if="revertable" icon="refresh" @click="revertTranslationOpen(id, language)">
              {{ $t('revert') }} {{ language.code.toUpperCase() }}
            </k-button>
          </k-button-group>

          <k-dialog
            ref="deleteDialog"
            :button="$t('delete')"
            theme="negative"
            icon="trash"
            @submit="deleteTranslationSubmit(id, language)"
          >
            <k-text v-html="$t('flokosiol.translations.delete.confirm', { code: language.code.toUpperCase() })" />
          </k-dialog>

          <k-dialog
            ref="revertDialog"
            :button="$t('revert')"
            theme="negative"
            icon="refresh"
            @submit="revertTranslationSubmit(id, language)"
          >
            <k-text v-html="$t('flokosiol.translations.revert.confirm', { code: language.code.toUpperCase() })" />
          </k-dialog>
        </div>
      `
    }
  }
});