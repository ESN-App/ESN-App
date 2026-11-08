using EsnApp.Application.Common;
using MediatR;

namespace EsnApp.Application.Settings;

public record SiteSettingsDto(string TimeZone);

/// <summary>Site-wide settings (public and admin read the same values).</summary>
public record GetSiteSettingsQuery : IRequest<Result<SiteSettingsDto>>;

public class GetSiteSettingsQueryHandler(ISiteSettingRepository repository)
    : IRequestHandler<GetSiteSettingsQuery, Result<SiteSettingsDto>>
{
    public async Task<Result<SiteSettingsDto>> Handle(
        GetSiteSettingsQuery request,
        CancellationToken cancellationToken)
    {
        var timeZone = await repository.GetByKeyAsync(SiteSettingKeys.TimeZone, cancellationToken);
        return Result.Success(new SiteSettingsDto(timeZone?.Value ?? SiteSettingKeys.DefaultTimeZone));
    }
}
