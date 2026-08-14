Feature: Profile and settings

  Background:
    Given a new registered user

  Scenario: Update display name
    Given I open the profile page
    When I change my display name to "Updated Name"
    And I save my profile
    Then I see a success message
