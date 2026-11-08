using EsnApp.Application.Common;
using EsnApp.Domain.Settings;
using FluentValidation;
using MediatR;

namespace EsnApp.Application.Settings;

public record UpdateSiteSettingsCommand(string TimeZone) : IRequest<Result<SiteSettingsDto>>;

public class UpdateSiteSettingsCommandValidator : AbstractValidator<UpdateSiteSettingsCommand>
{
    public UpdateSiteSettingsCommandValidator()
    {
        // HasIanaId rejects Windows ids that .NET would otherwise convert (the frontend needs IANA for Intl).
        RuleFor(command => command.TimeZone)
            .NotEmpty()
            .MaximumLength(100)
            .Must(id => TimeZoneInfo.TryFindSystemTimeZoneById(id, out var zone) && zone.HasIanaId)
            .WithMessage("'{PropertyValue}' is not a valid IANA time zone id.");
    }
}

public class UpdateSiteSettingsCommandHandler(ISiteSettingRepository repository)
    : IRequestHandler<UpdateSiteSettingsCommand, Result<SiteSettingsDto>>
{
    public async Task<Result<SiteSettingsDto>> Handle(
        UpdateSiteSettingsCommand request,
        CancellationToken cancellationToken)
    {
        var setting = await repository.UpsertAsync(
            new SiteSetting
            {
                Key = SiteSettingKeys.TimeZone,
                Value = request.TimeZone,
                UpdatedAt = DateTimeOffset.UtcNow,
            },
            cancellationToken);
        return Result.Success(new SiteSettingsDto(setting.Value));
    }
}
